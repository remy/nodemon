/*global describe:true, it: true */
import nodemon from '../../lib/index.js';
import assert from 'assert';;

describe('nodemon events', function () {
  it('should have (shims) events', function () {
    assert(nodemon.on);
  });

  it('should allow events to fire', function (done) {
    nodemon.on('foo', function () {
      assert(true);
      done();
    });

    nodemon.emit('foo');
  });
});


