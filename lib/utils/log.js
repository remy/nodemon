'use strict';

const colour = require('./colour');
const bus = require('./bus');

let required = false;
let useColours = true;

const coding = {
  log: 'black',
  info: 'yellow',
  status: 'green',
  detail: 'yellow',
  fail: 'red',
  error: 'red',
};

function log(type, text) {
  let msg = `[nodemon] ${text || ''}`;

  if (useColours) {
    msg = colour(coding[type], msg);
  }

  // always push the message through our bus, using nextTick
  // to help testing and get _out of_ promises.
  process.nextTick(() => {
    bus.emit('log', { type, message: text, colour: msg });
  });

  // but if we're running on the command line, also echo out
  if (!required) {
    if (type === 'error') {
      console.error(msg);
    } else {
      console.log(msg || '');
    }
  }
}

class Logger {
  constructor(r) {
    this.required(r);
  }

  required(val) {
    required = val;
  }

  _log(type, msg) {
    if (required) {
      bus.emit('log', { type, message: msg || '', colour: msg || '' });
    } else if (type === 'error') {
      console.error(msg);
    } else {
      console.log(msg || '');
    }
  }

  // detail is for messages that are turned on during debug
  detail(msg) {
    if (this.debug) {
      log('detail', msg);
    }
  }

  get useColours() {
    return useColours;
  }

  set useColours(val) {
    useColours = val;
  }
}

// Add dynamic methods for each coding type
Object.keys(coding).forEach((type) => {
  Logger.prototype[type] = log.bind(null, type);
});

Logger.prototype.debug = false;

module.exports = function (r) {
  if (!(this instanceof Logger)) {
    return new Logger(r);
  }
  this.required(r);
  return this;
};

module.exports.Logger = Logger;
