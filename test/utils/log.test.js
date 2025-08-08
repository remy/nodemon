'use strict';
/*global describe:true, it: true */
const Logger = require('../../lib/utils/log');
const logger = new Logger(true);
const bus = require('../../lib/utils/bus');
const colour = require('../../lib/utils/colour');
const assert = require('assert');

describe('logger', function () {
  const types = {
    log: 'black',
    info: 'yellow',
    status: 'green',
    detail: 'yellow',
    fail: 'red',
    error: 'red'
  };

  logger.debug = true;

  Object.keys(types).forEach(function (type) {
    it('should .' + type, function (done) {
      bus.once('log', function (event) {
        assert(event.message === type);
        assert(event.colour.indexOf(colour[types[type]]) !== -1);
        done();
      });
      logger[type](type);
    });
  });

  it('should disable colour', function () {
    const type = 'fail';
    bus.once('log', function (event) {
      assert.equal(event.message, type);
      assert.ok(event.colour.indexOf(colour[types[type]]) !== -1);
    });
    logger[type](type);

    logger.useColours = false;

    bus.once('log', function (event) {
      assert.equal(event.message, type);
      assert.ok(event.colour.indexOf(colour[types[type]]) === -1);
    });
    logger[type](type);

    logger.useColours = true;

    bus.once('log', function (event) {
      assert.equal(event.message, type);
      assert.ok(event.colour.indexOf(colour[types[type]]) !== -1);
    });
    logger[type](type);
  });

  // it('should not log detail if debug is off', function (done) {
  //   logger.debug = false;

  //   function handler() {
  //     assert(false, 'logged a message when we should not have done');
  //     bus.removeListener('log', handler);
  //     done();
  //   }

  //   bus.addListener('log', handler);

  //   logger.detail('detail');

  //   setTimeout(function () {
  //     bus.removeListener('log', handler);
  //     done();
  //   }, 500);
  // });
});