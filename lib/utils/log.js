'use strict';
var util = require('util'),
    colour = require('./colour'),
    bus = require('./bus'),
    required = false;

var coding = {
  log: 'black',
  info: 'yellow',
  status: 'green',
  detail: 'yellow',
  fail: 'red',
  error: 'red'
};

function log(type, text) {
  var msg = colour(coding[type], '[nodemon] ' + text);

  if (required) {
    bus.emit('log', { type: type, message: text, colour: msg });
  } else if (type === 'error') {
    util.error(msg);
  } else {
    util.log(msg);
  }
}

var logger = function (r) {
  required = r;

  return logger;
};

Object.keys(coding).forEach(function (type) {
  logger[type] = log.bind(null, type);
});

// logger.log = function (msg) {
//   log('log', ('[nodemon] ' + msg));
// };

// // info is for messages about how to use nodemon, like `rs` restart
// logger.info = function (msg) {
//   log('info', colour('yellow', '[nodemon] ' + msg));
// };

// // status is messages about nodemon state, like restarting
// logger.status = function (msg) {
//   log('status', colour('green', '[nodemon] ' + msg));
// };

// detail is for messages that are turned on during debug
logger.detail = function (msg) {
  if (this.debug) {
    log('detail', msg);
  }
};


// // non fatal warnings
// logger.fail = function (msg) {
//   log('fail', colour('red', '[nodemon] ' + msg));
// };

// // big bad errors
// logger.error = function (msg) {
//   log('error', colour('red', '[nodemon] ' + msg));
// };

logger.debug = false;

module.exports = logger;