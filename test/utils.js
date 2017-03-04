'use strict';
var fork = require('child_process').fork,
    nodemon = require('../lib/'),
    path = require('path'),
    appjs = path.resolve(__dirname, 'fixtures', 'app.js'),
    assert = require('assert'),
    port = 8000,
    appcoffee = path.resolve(__dirname, 'fixtures', 'app.coffee');

function asCLI(cmd) {
  return {
    exec: 'bin/nodemon.js',
    // make nodemon verbose so we can check the filters being applied
    args: ('-V ' + (cmd || '')).trim().split(' ')
  };
}

function match(str, key) {
  return str.indexOf(key) !== -1;
}

function reset(done) {
  nodemon.once('exit', function () {
    nodemon.reset();

    // Wait until chokidar will actually stop watching files
    setTimeout(done, 1000);
  }).emit('quit');
}

function monitorForChange(str) {
  var watch = false;
  return function (line) {
    if (match(line, 'files triggering change check: nodemonCheckFsWatch')) {
      watch = false;
    } else if (match(line, 'files triggering change check:')) {
      watch = true;
    }

    if (watch) {
      if (match(line, str)) {
        return true;
      }
    }

    return false;
  };
}

function run(cmd, callbacks) {
  var cli = typeof cmd === 'string' ? asCLI(cmd) : cmd;
  port++;
  process.env.PORT = port;
  var proc = fork(cli.exec, cli.args, {
    env: process.env,
    cwd: process.cwd(),
    encoding: 'utf8',
    silent: true,
  });

  proc.stderr.setEncoding('utf8');
  proc.stdout.setEncoding('utf8');

  if (callbacks.output) {
    proc.stdout.on('data', callbacks.output);
  }
  if (callbacks.restart) {
    proc.stdout.on('data', function (data) {
      if (match(data, 'restarting due to changes')) {
        callbacks.restart(null, data);
      }
    });
  }
  if (callbacks.error) {
    proc.stderr.on('data', function (error) {
      error = error.toString().trim();

      if (process.env.TRAVIS && error === 'User defined signal 2') {
        // swallow the SIGUSR2 - it should never hit the stderr, but for some
        // reason, travis sees it and causes our tests to fail, so we swallow
        // if this specific error bubbles out
      } else {
        callbacks.error(error);
      }
    });
  }

  return proc;
}

function cleanup(p, done, err) {
  // as above
  if (process.env.TRAVIS && err &&
    err.message.indexOf('User defined signal 2') === 0) {
    err = null;
  }
  if (p) {
    p.once('exit', function () {
      p = null;
      done(err);
    });
    p.send('quit');
  } else {
    done(err);
  }
}

function Plan(count, done) {
  this.done = done;
  this.count = count;
}

Plan.prototype.assert = function() {
  assert.apply(null, arguments);

  if (this.count === 0) {
    assert(false, 'Too many assertions called via "' + arguments[1] + '"');
  } else {
    this.count--;
  }

  if (this.count === 0) {
    this.done();
  }
};

function getTriggerCount(msg) {
  var changes = msg.split(/\n/).shift();
  changes = changes.replace(/\s*/gm, '').slice(-5).split('/');
  return changes.pop();
}

module.exports = {
  getTriggerCount: getTriggerCount,
  Plan: Plan,
  asCLI: asCLI,
  match: match,
  run: run,
  reset: reset,
  cleanup: cleanup,
  appjs: appjs,
  appcoffee: appcoffee,
  monitorForChange: monitorForChange,
  port: port,
};
