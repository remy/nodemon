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

// detail is for messages that are turned on during debug
logger.detail = function (msg) {
  if (this.debug) {
    log('detail', msg);
  }
};

logger.debug = false;

logger._log = log;

module.exports = logger;