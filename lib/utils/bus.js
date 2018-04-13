'use strict';
const events = require('events');
const debug = require('debug')('nodemon');
const util = require('util');

const Bus = function () {
  events.EventEmitter.call(this);
};

util.inherits(Bus, events.EventEmitter);

const bus = new Bus();

// /*
let collected = {};
bus.on('newListener', function (event) {
  debug('bus new listener: %s (%s)', event, bus.listeners(event).length);
  if (!collected[event]) {
    collected[event] = true;
    bus.on(event, function () {
      debug('bus emit: %s', event);
    });
  }
});

// */

// proxy process messages (if forked) to the bus
process.on('message', function (event) {
  debug('process.message(%s)', event);
  bus.emit(event);
});

const emit = bus.emit;

// if nodemon was spawned via a fork, allow upstream communication
// via process.send
if (process.send) {
  bus.emit = function (event, data) {
    process.send({ type: event, data: data });
    emit.apply(bus, arguments);
  };
}

module.exports = bus;
