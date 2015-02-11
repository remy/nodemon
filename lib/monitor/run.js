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
    hasPS = true;

// discover if the OS has `ps`, and therefore can use psTree
exec('ps', function(error) {
  if (error) {
    hasPS = false;
  }
});

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

  var sh = 'sh';
  var shFlag = '-c';

  if (utils.isWindows) {
    sh = 'cmd';
    shFlag = '/c';
  }

  var args = cmd.args.map(function (arg) {
    if (arg.indexOf(' ') !== -1) {
      arg = '"' + arg.replace(/"/g, '\\"') + '"';
    }
    return arg;
  });

  var executable = cmd.executable;

  // special logic for windows, as spaces in the paths need the path fragment
  // quoted, so it reads: c:\"Program Files"\nodejs\node.exe
  if (utils.isWindows && executable.indexOf(' ') !== -1) {
    executable = executable.split('\\').map(function (part) {
      if (part.indexOf(' ') !== -1) {
        return '"' + part.replace(/"/g, '\\"') + '"';
      }
      return part;
    }).join('\\');
  }

  args = [executable].concat(args).join(' ').trim();

  var spawnArgs = [sh, [shFlag, args]];

  if (utils.version.major === 0 && utils.version.minor < 8) {
    // use the old spawn args :-\
  } else {
    spawnArgs.push({
      env: utils.merge(options.execOptions.env, process.env),
      stdio: stdio
    });
  }

  child = spawn.apply(null, spawnArgs);

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

      bus.stdout = child.stdout;
      bus.stderr = child.stderr;
    }
  }

  bus.emit('start');

  utils.log.detail('child pid: ' + child.pid);

  child.on('error', function (error) {
    bus.emit('error', error);
    if (error.code === 'ENOENT') {
      utils.log.error('unable to run executable: "' + cmd.executable + '"');
      process.exit(1);
    } else {
      utils.log.error('failed to start child process: ' + error.code);
      throw error;
    }
  });

  child.on('exit', function (code, signal) {
    if (code === 127) {
      utils.log.error('failed to start process, "' + cmd.executable + '" exec not found');
      bus.emit('error', code);
      process.exit();
    }

    if (code === 2) {
      // something wrong with parsed command
      utils.log.error('failed to start process, possible issue with exec arguments');
      bus.emit('error', code);
      process.exit();
    }

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

  run.kill = function (noRestart, callback) {
    // I hate code like this :(  - Remy (author of said code)
    if (typeof noRestart === 'function') {
      callback = noRestart;
      noRestart = false;
    }

    if (!callback) {
      callback = noop;
    }

    if (child !== null) {
      // if the stdin piping is on, we need to unpipe, but also close stdin on
      // the child, otherwise linux can throw EPIPE or ECONNRESET errors.
      if (options.stdin) {
        if (process.stdin.unpipe) { // node > 0.8
          process.stdin.unpipe(child.stdin);
        }
      }

      if (utils.isWindows) {
        // For the on('exit', ...) handler above the following looks like a crash,
        // so we set the killedAfterChange flag
        killedAfterChange = true;
      }

      /* Now kill the entire subtree of processes belonging to nodemon */
      var oldPid = child.pid;
      if (child) {
        kill(child, 'SIGUSR2', function () {
          // this seems to fix the 0.11.x issue with the "rs" restart command,
          // though I'm unsure why. it seems like more data is streamed in to
          // stdin after we close.
          if (child && options.stdin && oldPid === child.pid) {
            // this is stupid and horrible, but node 0.12 on windows blows up
            // with this line, so we'll skip it entirely.
            if (!utils.isWindows) {
              child.stdin.end();
            }
          }
          callback();
        });
      }
    } else if (!noRestart) {
      // if there's no child, then we need to manually start the process
      // this is because as there was no child, the child.on('exit') event
      // handler doesn't exist which would normally trigger the restart.
      bus.once('start', callback);
      restart();
    } else {
      callback();
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

function kill(child, signal, callback) {
  if (!callback) {
    callback = function () {};
  }

  if (utils.isWindows) {
    // When using CoffeeScript under Windows, child's process is not node.exe
    // Instead coffee.cmd is launched, which launches cmd.exe, which starts
    // node.exe as a child process child.kill() would only kill cmd.exe, not
    // node.exe
    // Therefore we use the Windows taskkill utility to kill the process and all
    // its children (/T for tree).
    // Force kill (/F) the whole child tree (/T) by PID (/PID 123)
    exec('taskkill /pid '+ child.pid + ' /T /F');
    callback();
  } else {
    if (hasPS) {
      // we use psTree to kill the full subtree of nodemon, because when spawning
      // processes like `coffee` under the `--debug` flag, it'll spawn it's own
      // child, and that can't be killed by nodemon, so psTree gives us an array
      // of PIDs that have spawned under nodemon, and we send each the SIGUSR2
      // signal, which fixes #335
      psTree(child.pid, function (err, children) {
        spawn('kill', ['-s', signal, child.pid].concat(children.map(function (p) {
          return p.PID;
        }))).on('close', callback);
      });
    } else {
      exec('kill -s ' + signal + ' ' + child.pid, function (error) {
        // ignore if the process has been killed already
        callback();
      });
    }
  }
}

// stubbed out for now, filled in during run
run.kill = function (flag, callback) {
  if (callback) {
    callback()
  }
};
run.restart = noop;

bus.on('quit', function () {
  // remove event listener
  var exitTimer = null;
  var exit = function () {
    clearTimeout(exitTimer);
    exit = noop; // null out in case of race condition
    child = null;
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
    // give up waiting for the kids after 10 seconds
    exitTimer = setTimeout(exit, 10 * 1000);
    child.removeAllListeners('exit');
    child.once('exit', exit);

    kill(child, 'SIGINT');
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
  process.once('SIGINT', function () {
    var exitTimer = null;
    var exit = function () {
          clearTimeout(exitTimer);
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
      exitTimer = setTimeout(exit, 10 * 1000);
    } else {
      exit();
    }
  });

  process.once('SIGTERM', function () {
    if (child) { child.kill('SIGTERM'); }
    process.exit(0);
  });
}


module.exports = run;
