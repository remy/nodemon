var utils = require('../utils'),
    childProcess = require('child_process'),
    spawn = childProcess.spawn,
    exec = childProcess.exec,
    watch = require('./watch'),
    child = null, // the actual child process we spawn
    lastStarted = null,
    timeout = 1000; // check every 1 second;

function startNode(executable, appargs, options) {
  utils.log.status('starting `' + executable + ' ' + appargs.join(' ') + '`');

  lastStarted = Date.now();

  var nodeMajor = parseInt((process.versions.node.split('.') || [undefined,undefined,undefined])[1] || 0, 10);

  if (nodeMajor >= 8) {
    child = spawn(executable, appargs, {
      stdio: ['pipe', process.stdout, process.stderr]
    });
  } else {
    child = spawn(executable, appargs);
    child.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function (data) {
      process.stderr.write(data);
    });
  }

  child.on('error', function (error) {
    if (error.code === 'ENOENT') {
      utils.log.error('unable to spawn executable: ' + executable);
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

    // exit the monitor, but do it gracefully
    if (signal === 'SIGUSR2') {
      // restart
      startNode();
    } else if (code === 0) { // clean exit - wait until file change to restart
      utils.log.status('clean exit - waiting for changes before restart');
      child = null;
    } else if (options.exitcrash) {
      utils.log.fail('app crashed');
      process.exit(0);
    } else {
      utils.log.fail('app crashed - waiting for file changes before starting...');
      child = null;
    }
  });

  // pinched from https://github.com/DTrejo/run.js - pipes stdin to the child process - cheers DTrejo ;-)
  if (options.stdin) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.pipe(child.stdin);
  }

  setTimeout(watch, timeout);
}

module.exports = startNode;