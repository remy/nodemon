/*global describe:true, it: true */
var nodemon = null,
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js');



describe('require-able', function () {
  beforeEach(function () {
    nodemon = require('../../lib/');
  });

  // it('should know nodemon has been required', function () {
  //   assert(nodemon.config.required, 'nodemon has required property');
  // });

  it('should restart on file change', function (done) {
    var restarted = false;

    nodemon(appjs).on('start', function () {
      setTimeout(function () {
        touch.sync(appjs);
      }, 1000);
    }).on('restart', function () {
      restarted = true;
      nodemon.emit('quit');
    }).on('quit', function () {
      assert(restarted);
      done();
    });
  });
});