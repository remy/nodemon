'use strict';
/*global describe:true, it: true, after: true */
var watchable = require('../../lib/config/watchable'),
    bus = require('../../lib/utils/bus'),
    assert = require('assert');

// bus.on('log', function (event) {
//   console.log(event.colour);
// });

describe('watchable tests', function () {
  it('should return whether watch is supported', function (done) {
    watchable({ system: {} }, function () {
      done();
    });
  });
});