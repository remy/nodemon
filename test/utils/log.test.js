'use strict';
/*global describe:true, it: true */
var logger = require('../../lib/utils/log')(true),
    bus = require('../../lib/utils/bus'),
    colour = require('../../lib/utils/colour'),
    assert = require('assert');

describe('logger', function () {
  var types = {
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