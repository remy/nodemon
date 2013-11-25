var util = require('util'),
    noop = function () {},
    colour = require('./colour');

var log = function (msg) {
  util.log(('[nodemon] ' + msg));
};

log.log = function (msg) {
  util.log(('[nodemon] ' + msg));
};

// info is for messages about how to use nodemon, like `rs` restart
log.info = function (msg) {
  util.log(colour('yellow', '[nodemon] ' + msg));
};

// status is messages about nodemon state, like restarting
log.status = function (msg) {
  util.log(colour('green', '[nodemon] ' + msg));
};

// detail is for messages that are turned on during debug
log.detail = function (msg) {
  if (utils.debug) util.log(colour('yellow', '[nodemon] ' + msg));
};


// non fatal warnings
log.fail = function (msg) {
  util.log(colour('red', '[nodemon] ' + msg));
};

// big bad errors
log.error = function (msg) {
  util.error(colour('red', '[nodemon] ' + msg));
};

var utils = {
  clone: require('./clone'),
  merge: require('./merge'),
  bus: require('./bus'),
  isWindows: process.platform === 'win32',
  home: process.env.HOME || process.env.HOMEPATH,
  log: log,
  debug: false,
  quiet: function () {
    // nukes the logging
    Object.keys(log).forEach(function (method) {
      log[method] = noop;
    });
  }
};

module.exports = utils;