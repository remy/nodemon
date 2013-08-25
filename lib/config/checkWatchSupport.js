var utils = require('../utils'),
    watchable = require('./watchable'),
    fs = require('fs'),
    exec = require('child_process').exec;

module.exports = canMonitor;

// test to see if the version of find being run supports searching by seconds
// (-mtime -1s -print)
function canMonitor(config, callback) {
  var ready = function () {
    watchable.check(function(success) {
      // whether or not fs.watch actually works on this platform, tested and set
      // later before starting
      config.system.watchWorks = success;
      callback();
    });
  };

  config.system.noWatch = !utils.isWindows || !fs.watch;

  if (config.system.noWatch) {
    exec('find -L /dev/null -type f -mtime -1s -print', function(error) {
      if (error) {
        if (!fs.watch) {
          utils.log.error('The version of node you are using combined with the version of find being used does not support watching files. Upgrade to a newer version of node, or install a version of find that supports search by seconds.');
          process.exit(1);
        } else {
          config.system.noWatch = false;
          ready();
        }
      } else {
        // Find is compatible with -1s
        callback();
      }
    });
  } else {
    ready();
  }
}