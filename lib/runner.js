function startNode() {
  util.log('\x1B[32m[nodemon] starting `' + program.options.exec + ' ' + program.args.join(' ') + '`\x1B[0m');

  lastStarted = Date.now();

  var nodeMajor = parseInt((process.versions.node.split('.') || [undefined,undefined,undefined])[1] || 0, 10);

  if (nodeMajor >= 8) {
    child = spawn(program.options.exec, program.args, {
      stdio: ['pipe', process.stdout, process.stderr]
    });
  } else {
    child = spawn(program.options.exec, program.args);
    child.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function (data) {
      process.stderr.write(data);
    });
  }

  child.on('exit', function (code, signal) {
    // In case we killed the app ourselves, set the signal thusly
    if (killedAfterChange) {
      killedAfterChange = false;
      signal = 'SIGUSR2';
    }
    // this is nasty, but it gives it windows support
    if (isWindows && signal === 'SIGTERM') {
      signal = 'SIGUSR2';
    }

    // exit the monitor, but do it gracefully
    if (signal === 'SIGUSR2') {
      // restart
      startNode();
    } else if (code === 0) { // clean exit - wait until file change to restart
      util.log('\x1B[32m[nodemon] clean exit - waiting for changes before restart\x1B[0m');
      child = null;
    } else if (program.options.exitcrash) {
      util.log('\x1B[1;31m[nodemon] app crashed\x1B[0m');
      process.exit(0);
    } else {
      util.log('\x1B[1;31m[nodemon] app crashed - waiting for file changes before starting...\x1B[0m');
      child = null;
    }
  });

  // pinched from https://github.com/DTrejo/run.js - pipes stdin to the child process - cheers DTrejo ;-)
  if (program.options.stdin) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.pipe(child.stdin);
  }

  setTimeout(startMonitor, timeout);
}

module.exports = {
  runner: runner;
}