var utils = require('./utils'),
    config = require('./config');

// does not export anything, only listens for events
module.exports = {};

// remove the flag file on exit
process.on('exit', function (code) {
  if (config.options.verbose) {
    utils.log.status('exiting');
  }
  cleanup();
});

// because windows borks when listening for the SIG* events
if (!utils.isWindows) {
  // usual suspect: ctrl+c exit
  process.on('SIGINT', function () {
    var exitTimeout = null,
        exit = function () {
          exit = function () {};
          cleanup();
          process.exit(0);
        };

    if (child && !isWindows) {
      child.removeAllListeners('exit');
      child.on('exit', exit);
      child.kill('SIGINT');
      setTimeout(exit, 10 * 1000); // give up waiting for the kids after 10 seconds
    } else {
      exit();
    }
  });

  process.on('SIGTERM', function () {
    cleanup();
    process.exit(0);
  });
}

// on exception *inside* nodemon, shutdown wrapped node app
process.on('uncaughtException', function (err) {
  utils.error('exception in nodemon killing node');
  util.error(err.stack);
  cleanup();
});
