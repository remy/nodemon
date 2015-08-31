var utils = require('../utils');
var watchable = require('./watchable');
var fs = require('fs');
var exec = require('child_process').exec;
var checkComplete = false;

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
    if (!checkComplete) {
      checkComplete = true;
      callback(config);
    }
  };

  var alternativeCheck = function () {
    watchable.check(function (success) {
      // whether or not fs.watch actually works on this platform, tested and set
      // later before starting
      config.system.useWatch = success;
      ready(config);
    });
  };

  // Note: we're purposely putting Mac over to the `find` command.
  // this is because it has a default ulimit of 256 - which is WAY LOW,
  // and without asking the user to `unlimit -n <BIG-ASS-NUMBER>` it'll throw
  // up all over your screen like this: http://d.pr/i/R6B8+
  // even with higher ulimit -n Mac has another problem:
  // https://github.com/joyent/node/issues/5463
  // This will be fixed in 0.12, before then we default to find
  config.system.useFind = utils.isMac || utils.isLinux || !fs.watch;
  var mtime = utils.isMac ? '-mtime -1s' : '-mmin -0.01';
  if (config.system.useFind) {
    exec('find -L /dev/null -type f ' + mtime + ' -print', function (error) {
      if (error) {
        if (!fs.watch) {
          var notice = 'The version of node you are using combined with the ' +
            'version of find being used does not support watching files. ' +
            'Upgrade to a newer version of node, or install a version of ' +
            'find that supports search by seconds.';

          utils.log.error(notice);
          process.exit(1);
        } else {
          config.system.useFind = false;
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
