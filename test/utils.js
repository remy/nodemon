'use strict';
var fork = require('child_process').fork,
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
    proc.stderr.on('data', callbacks.error);
  }

  return proc;
}

function cleanup(p, done, err) {
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
  console.log(arguments);

  if (this.count === 0) {
    assert(false, 'Too many assertions called via "' + arguments[1] + '"');
  } else {
    this.count--;
  }

  if (this.count === 0) {
    this.done();
  }
};

module.exports = {
  Plan: Plan,
  asCLI: asCLI,
  match: match,
  run: run,
  cleanup: cleanup,
  appjs: appjs,
  appcoffee: appcoffee,
  monitorForChange: monitorForChange,
  port: port,
};
