'use strict';
var fork = require('child_process').fork,
    path = require('path'),
    appjs = path.resolve(__dirname, 'fixtures', 'app.js'),
    assert = require('assert'),
    appcoffee = path.resolve(__dirname, 'fixtures', 'app.coffee'),
    getPort = require('get-port');

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

async function run(cmd) {
  var cli = typeof cmd === 'string' ? asCLI(cmd) : cmd;
  const port = await getPort({port: getPort.makeRange(8000, 9000)});
  process.env.PORT = port;
  var proc = fork(cli.exec, cli.args, {
    env: process.env,
    cwd: process.cwd(),
    encoding: 'utf8',
    silent: true,
  });

  proc.stderr.setEncoding('utf8');
  proc.stdout.setEncoding('utf8');

  return proc;
}

function setCallbacks(proc, callbacks) {
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
  // console.log(arguments[1]);

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

function isRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code && error.code === 'ESRCH') return false
    throw error
  }
}

module.exports = {
  getTriggerCount: getTriggerCount,
  Plan: Plan,
  asCLI: asCLI,
  match: match,
  run: run,
  setCallbacks: setCallbacks,
  cleanup: cleanup,
  appjs: appjs,
  appcoffee: appcoffee,
  monitorForChange: monitorForChange,
  isRunning: isRunning
};
