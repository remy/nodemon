'use strict';
var fork = require('child_process').fork,
    path = require('path'),
    appjs = path.resolve(__dirname, 'fixtures', 'app.js'),
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

function run(cmd, callbacks) {
  var cli = typeof cmd === 'string' ? asCLI(cmd) : cmd;
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
    p.on('exit', function () {
      p = null;
      done(err);
    });
    p.send('quit');
  } else {
    done(err);
  }
}

module.exports = {
  asCLI: asCLI,
  match: match,
  run: run,
  cleanup: cleanup,
  appjs: appjs,
  appcoffee: appcoffee
};