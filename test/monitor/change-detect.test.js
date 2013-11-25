/*global describe:true, it: true */
var path = require('path'),
    colour = require('../../lib/utils/colour'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js'),
    appcoffee = path.resolve(__dirname, '..', 'fixtures', 'app.coffee'),
    childProcess = require('child_process'),
    touch = require('touch'),
    fork = childProcess.fork,
    assert = require('assert'),
    lastChild = null,
    ctr = 0,
    pids = [];

function touch(path) {
  fs.readFile(path, 'utf8', function (err, data) {
    fs.writeFile(path, data);
  });
}

function asCLI(cmd) {
  return {
    exec: 'bin/nodemon.js',
    args: cmd.trim().split(' ')
  }
}

function noop() {
  return function () {};
}

function match(str, key) {
  return str.indexOf(key) !== -1;
}

function run(cmd, callbacks) {
  var cli = asCLI(cmd);
  var proc = fork(cli.exec, cli.args, {
    env: process.env,
    cwd: process.cwd(),
    encoding: 'utf8',
    silent: true,
  });

  lastChild = proc;

  pids.push(proc.pid);

  proc.stderr.setEncoding('utf8');
  proc.stdout.setEncoding('utf8');

  // proc.on('close', function (code) {
  //   console.log('child process exited with code ' + code);
  // });
  proc.stdout.on('data', function (data) {
    if (match(data, 'pid: ')) {
      pids.push(colour.strip(data).trim().replace(/.*pid:\s/, '') * 1);
    }
  });
  if (callbacks.output) proc.stdout.on('data', callbacks.output);
  if (callbacks.restart) proc.stdout.on('data', function (data) {
    if (match(data, 'restarting due to changes')) {
      callbacks.restart(null, data);
    }
  });
  if (callbacks.error) proc.stderr.on('data', callbacks.error);

  return proc;
}

function cleanup(done, err) {
  if (lastChild) {
    lastChild.on('exit', function () {
      lastChild = null;
      done(err);
    });
    lastChild.send('quit');
  } else {
    done(err);
  }
}

describe('nodemon simply running', function () {
  after(function (done) {
    pids.forEach(function (pid) {
      try {
        process.kill(pid);
      } catch (e) {
        // ignore those processes that were kill by the cleanup process
      }
    });
    done();
    pids = [];
  });

  it('should start', function (done) {
    run(appjs, {
      output: function (data) {
        if (match(data, appjs)) {
          cleanup(done);
        }
      },
      error: function (data) {
        cleanup(done, new Error(data));
      }
    });
  });

});

describe('nodemon monitor', function () {
  // after(function (done) {
  //   pids.forEach(function (pid) {
  //     try {
  //       process.kill(pid);
  //     } catch (e) {
  //       // ignore those processes that were kill by the cleanup process
  //     }
  //   });
  //   done();
  // });
  //
  var complete = function (p, done, err) {
    p.once('exit', function () {
      done(err);
    });
    p.send('quit');
  }

  it('should restart on .js file changes with no arguments', function (done) {
    var p = run(appjs, {
      output: function (data) {
        console.log(data);
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();
          assert(restartedOn == '1');
        }
      },
      error: function (data) {
        complete(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'restart') {
        complete(p, done);
      } else if (event.type === 'start') {
        setTimeout(function () {
          touch.sync(appjs);
        }, 1000);
      }
    })
  });

  it('should NOT restart on non-.js file changes with no arguments', function (done) {
    var p = run(appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();

          assert(restartedOn == '0', 'expects to not have restarted');
          complete(p, done);
        }
      },
      error: function (data) {
        complete(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          touch.sync(appcoffee);
        }, 1000);
      }
    });
  });
});













