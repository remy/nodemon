import { EventEmitter } from 'events';
import Debug from 'debug';
import { inherits } from 'util';

const debug = Debug('nodemon');

var Bus = function () {
  EventEmitter.call(this);
};

inherits(Bus, EventEmitter);

var bus = new Bus();

// /*
var collected = {};
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

var emit = bus.emit;

// if nodemon was spawned via a fork, allow upstream communication
// via process.send
if (process.send) {
  bus.emit = function (event, data) {
    process.send({ type: event, data: data });
    emit.apply(bus, arguments);
  };
}

export default bus;
