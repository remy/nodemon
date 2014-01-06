'use strict';
var utils = require('../utils'),
    watchable = require('./watchable'),
    fs = require('fs'),
    exec = require('child_process').exec,
    checkComplete = false;

module.exports = checkWatchSupport;

/**
 * Runs tests to see if the version of `find` being run supports searching by
 * seconds using `-mtime -1s -print`. Note that this function **modifies** the
 * config being passed in.
 *
 * @param  {Object}   config   reference to config that's *updated* inside
 * @param  {Function} ready once the monitor checks are complete, call ready
 */
function checkWatchSupport(config, callback) {
  if (checkComplete) {
    return callback(config);
  }

  var ready = function () {
    checkComplete = true;
    callback(config);
  };

  var alternativeCheck = function () {
    watchable.check(function(success) {
      // whether or not fs.watch actually works on this platform, tested and set
      // later before starting
      config.system.watchWorks = success;
      ready(config);
    });
  };

  // Note: we're purposely putting Mac over to the `find` command.
  // this is because it has a default ulimit of 256 - which is WAY LOW,
  // and without asking the user to `unlimit -n <BIG-ASS-NUMBER>` it'll throw
  // up all over your screen like this: http://d.pr/i/R6B8+
  config.system.noWatch = process.platform === 'darwin' || !fs.watch;
  if (config.system.noWatch) {
    exec('find -L /dev/null -type f -mtime -1s -print', function(error) {
      if (error) {
        if (!fs.watch) {
          utils.log.error('The version of node you are using combined with the version of find being used does not support watching files. Upgrade to a newer version of node, or install a version of find that supports search by seconds.');
          process.exit(1);
        } else {
          config.system.noWatch = false;
          alternativeCheck();
        }
      } else {
        // Find is compatible with -1s
        ready(config);
      }
    });
  } else {
    alternativeCheck();
  }
}