'use strict';
var utils = require('../utils'),
    bus = utils.bus,
    childProcess = require('child_process'),
    spawn = childProcess.spawn,
    exec = childProcess.exec,
    watch = require('./watch'),
    config = require('../config'),
    child = null, // the actual child process we spawn
    killedAfterChange = false,
    // timeout = 1000, // check every 1 second
    noop = function() {},
    restart = null,
    psTree = require('ps-tree'),
    nodeMajor = parseInt((process.versions.node.split('.') || [null,null])[1] || 0, 10);

function run(options) {
  var cmd = config.command.raw;

  utils.log.status('starting `' + config.command.string + '`');

  /*jshint validthis:true*/
  restart = run.bind(this, options);
  run.restart = restart;

  config.lastStarted = Date.now();

  var stdio = ['pipe', 'pipe', 'pipe'];

  if (config.options.stdout) {
    stdio = ['pipe', process.stdout, process.stderr];
  }

  if (nodeMajor >= 8) {
    child = spawn(cmd.executable, cmd.args, {
      env: utils.merge(options.execOptions.env, process.env),
      stdio: stdio
    });
  } else {
    child = spawn(cmd.executable, cmd.args);
  }

  bus.emit('start');

  if (config.required) {
    var emit = {
      stdout: function (data) {
        bus.emit('stdout', data);
      },
      stderr: function (data) {
        bus.emit('stderr', data);
      }
    };

    // now work out what to bind to...
    if (config.options.stdout) {
      child.on('stdout', emit.stdout).on('stderr', emit.stderr);
    } else {
      child.stdout.on('data', emit.stdout);
      child.stderr.on('data', emit.stderr);
    }
  }

  utils.log.detail('child pid: ' + child.pid);

  child.on('error', function (error) {
    if (error.code === 'ENOENT') {
      utils.log.error('unable to run executable: "' + cmd.executable + '"');
      process.exit(1);
    }
  });

  child.on('exit', function (code, signal) {
    // In case we killed the app ourselves, set the signal thusly
    if (killedAfterChange) {
      killedAfterChange = false;
      signal = 'SIGUSR2';
    }
    // this is nasty, but it gives it windows support
    if (utils.isWindows && signal === 'SIGTERM') {
      signal = 'SIGUSR2';
    }

    if (signal === 'SIGUSR2' || code === 0) {
      // this was a clean exit, so emit exit, rather than crash
      bus.emit('exit');

      // exit the monitor, but do it gracefully
      if (signal === 'SIGUSR2') {
        // restart
        restart();
      } else if (code === 0) { // clean exit - wait until file change to restart
        utils.log.status('clean exit - waiting for changes before restart');
        child = null;
      }
    } else {
      bus.emit('crash');
      if (options.exitcrash) {
        utils.log.fail('app crashed');
        if (!config.required) {
          process.exit(0);
        }
      } else {
        utils.log.fail('app crashed - waiting for file changes before starting...');
        child = null;
      }
    }
  });

  run.kill = function () {
    if (child !== null) {
      // if the stdin piping is on, we need to unpipe, but also close stdin on
      // the child, otherwise linux can throw EPIPE or ECONNRESET errors.
      if (options.stdin) {
        if (process.stdin.unpipe) { // node > 0.8
          process.stdin.unpipe(child.stdin);
        }
        child.stdin.end();
      }

      if (utils.isWindows) {
        // For the on('exit', ...) handler above the following looks like a crash,
        // so we set the killedAfterChange flag
        killedAfterChange = true;
      }

      /* Now kill the entire subtree of processes belonging to nodemon */
      kill(child, 'SIGUSR2');
    } else {
      // if there's no child, then we need to manually start the process
      // this is because as there was no child, the child.on('exit') event
      // handler doesn't exist which would normally trigger the restart.
      restart();
    }
  };

  // connect stdin to the child process (options.stdin is on by default)
  if (options.stdin) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.pipe(child.stdin);
  }

  watch();
}

function kill(child, signal) {
  if (utils.isWindows) {
    // When using CoffeeScript under Windows, child's process is not node.exe
    // Instead coffee.cmd is launched, which launches cmd.exe, which starts
    // node.exe as a child process child.kill() would only kill cmd.exe, not
    // node.exe
    // Therefore we use the Windows taskkill utility to kill the process and all
    // its children (/T for tree).
    // Force kill (/F) the whole child tree (/T) by PID (/PID 123)
    exec('taskkill /pid '+ child.pid + ' /T /F');
  } else {
    // we use psTree to kill the full subtree of nodemon, because when spawning
    // processes like `coffee` under the `--debug` flag, it'll spawn it's own
    // child, and that can't be killed by nodemon, so psTree gives us an array
    // of PIDs that have spawned under nodemon, and we send each the SIGUSR2
    // signal, which fixes #335
    psTree(child.pid, function (err, children) {
      spawn('kill', ['-s', signal, child.pid].concat(children.map(function (p) {
        return p.PID;
      })));
    });
  }
}

// stubbed out for now, filled in during run
run.kill = noop;
run.restart = noop;

bus.on('quit', function () {
  // remove event listener
  var exit = function () {
    exit = noop; // null out in case of race condition
    if (!config.required) {
      process.exit(0);
    } else {
      bus.emit('exit');
    }
  };

  // if we're not running already, don't bother with trying to kill
  if (config.run === false) {
    return exit();
  }

  // immediately try to stop any polling
  config.run = false;

  if (child) {
    child.removeAllListeners('exit');
    child.on('exit', exit);

    kill(child, 'SIGINT');

    // give up waiting for the kids after 10 seconds
    setTimeout(exit, 10 * 1000);
  } else {
    exit();
  }
});

bus.on('restart', function () {
  // run.kill will send a SIGINT to the child process, which will cause it
  // to terminate, which in turn uses the 'exit' event handler to restart
  run.kill();
});

// remove the flag file on exit
process.on('exit', function () {
  utils.log.detail('exiting');
  if (child) { child.kill(); }
});

// because windows borks when listening for the SIG* events
if (!utils.isWindows) {
  // usual suspect: ctrl+c exit
  process.on('SIGINT', function () {
    var exit = function () {
          bus.emit('exit');
          exit = noop;
          if (child) { child.kill('SIGINT'); }
          process.exit(0);
        };

    if (child) {
      child.removeAllListeners('exit');
      child.on('exit', exit);
      child.kill('SIGINT');
      // give up waiting for the kids after 10 seconds,
      // this is usually when the child is capturing the SIGINT
      setTimeout(exit, 10 * 1000);
    } else {
      exit();
    }
  });

  process.on('SIGTERM', function () {
    if (child) { child.kill('SIGTERM'); }
    process.exit(0);
  });
}


module.exports = run;