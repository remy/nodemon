'use strict';
/*global describe:true, it: true, afterEach: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js');

describe('require-able', function () {
  afterEach(function (done) {
    nodemon.once('exit', function () {
      nodemon.reset();
      done();
    }).emit('quit');
  });

  it('should know nodemon has been required', function () {
    assert(nodemon.config.required, 'nodemon has required property');
  });

  it('should restart on file change', function (done) {
    var restarted = false;

    nodemon({ script: appjs, verbose: true, env: { PORT: utils.port + 1 } }).on('start', function () {
      setTimeout(function () {
        touch.sync(appjs);
      }, 1000);
    }).on('restart', function () {
      restarted = true;
      nodemon.emit('quit');
    }).on('quit', function () {
      assert(restarted, 'nodemon restarted and quit properly');
      nodemon.reset(done);
    }).on('log', function (event) {
      // console.log(event.message);
    });
  });

  it('should be restartable', function (done) {
    var restarted = false;

    nodemon(appjs).on('start', function () {
      setTimeout(function () {
        nodemon.restart();
      }, 1000);
    }).on('restart', function () {
      restarted = true;
      nodemon.emit('quit');
    }).on('quit', function () {
      assert(restarted);
      nodemon.reset(done);
      // unbind events for testing again
    });
  });

});
