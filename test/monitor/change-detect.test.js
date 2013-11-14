/*global describe:true, it: true */
var nodemon = 'bin/nodemon.js',
    path = require('path'),
    colour = require('../../lib/utils/colour'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js'),
    appcoffee = path.resolve(__dirname, '..', 'fixtures', 'app.coffee'),
    childProcess = require('child_process'),
    touch = require('touch'),
    spawn = childProcess.spawn,
    assert = require('assert'),
    lastChild = null,
    ctr = 0,
    pids = [];

function asCLI(cmd) {
  return {
    exec: 'node',
    args: (nodemon + ' ' + cmd).trim().split(' ')
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
  var proc = spawn(cli.exec, cli.args, {
    env: process.env,
    cwd: process.cwd()
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
}

function cleanup(done) {
  if (lastChild) {
    lastChild.on('exit', function () {
      lastChild = null;
      done();
    });
    lastChild.kill();
  } else {
    done();
  }
}

describe('nodemon monitor', function () {
  after(function (done) {
    pids.forEach(function (pid) {
      try {
        process.kill(pid);
      } catch (e) {
        // ignore those processes that were kill by the cleanup process
      }
    });
    done();
  });

  it('should restart on .js file changes with no arguments', function (done) {
    setTimeout(function () {
      touch.sync(appjs);
    }, 1000);

    run(appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();

          assert(restartedOn == '1');
          cleanup(done);
        }
      },
      error: function (data) {
        new Error(data);
      }
    });
  });

  it('should NOT restart on non-.js file changes with no arguments', function (done) {
    setTimeout(function () {
      touch.sync(appcoffee);
    }, 1000);

    run(appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();

          assert(restartedOn == '0');
          cleanup(done);
        }
      },
      error: function (data) {
        new Error(data);
      }
    });


  });
});













