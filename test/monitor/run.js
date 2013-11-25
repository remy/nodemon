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

function asCLI(cmd) {
  return {
    exec: 'bin/nodemon.js',
    args: cmd.trim().split(' ')
  }
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
    silent: true
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

describe('nodemon fork', function () {
  it('should start', function (done) {
    var p = run(appjs, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type == 'start') {
        p.send('quit');
        done();
      }
    });
  });
});