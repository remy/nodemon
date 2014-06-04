'use strict';
var events = require('events'),
    util = require('util');

var Bus = function () {
  events.EventEmitter.call(this);
};

util.inherits(Bus, events.EventEmitter);

var bus = new Bus();

// proxy process messages (if forked) to the bus
process.on('message', function (event) {
  bus.emit(event);
});

var emit = bus.emit;

// if nodemon was spawned via a fork, allow upstream communication
// via process.send
if (process.send) {
  bus.emit = function (event, data) {
    process.send({ type: event, data: data });
    emit.apply(bus, arguments);
  };
}

module.exports = bus;
