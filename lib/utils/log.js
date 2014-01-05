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
  var msg = colour(coding[type], '[nodemon] ' + (text||''));

  if (required) {
    bus.emit('log', { type: type, message: text, colour: msg });
  } else if (type === 'error') {
    util.error(msg);
  } else {
    util.log(msg);
  }
}

var Logger = function (r) {
  if (!(this instanceof Logger)) {
    return new Logger(r);
  }
  this.required(r);
  return this;
};

Object.keys(coding).forEach(function (type) {
  Logger.prototype[type] = log.bind(null, type);
});

// detail is for messages that are turned on during debug
Logger.prototype.detail = function (msg) {
  if (this.debug) {
    log('detail', msg);
  }
};

Logger.prototype.required = function (val) {
  required = val;
};

Logger.prototype.debug = false;
Logger.prototype._log = function (type, msg) {
  if (required) {
    bus.emit('log', { type: type, message: msg || '', colour: msg || '' });
  } else if (type === 'error') {
    util.error(msg);
  } else {
    console.log(msg || '');
  }
};

module.exports = Logger;