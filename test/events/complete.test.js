'use strict';
/*global describe:true, it: true, afterEach: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'env.js');

describe('events should follow normal flow on user triggered change', function () {
  // after(function (done) {
  //   nodemon.once('exit', function () {
  //     nodemon.reset();
  //     done();
  //   }).emit('quit');
  // });

  before(function (done) {
    nodemon.reset(done);
  });

  var run = 0;
  it('start', function (done) {
    var plan = new utils.Plan(2, done);
    nodemon.once('start', function () {
      run++;
      plan.assert(true, '"start" event');
    });
  });

  it('config:update', function (done) {
    nodemon.on('config:update', function () {
      assert(true, '"config:update" event');
      done();
    });
  });

  it('exit', function (done) {
    var plan = new utils.Plan(3, done);
    nodemon.on('exit', function () {
      plan.assert(true, '"exit" event');
      if (run === 1) {
        setTimeout(function () {
          plan.assert(true, 'restarting');
          touch.sync(appjs);
        }, 1000);
      } else if (run === 2) {
        plan.assert(true, 'finished');
      } else {
        plan.assert(false, 'quit too many times: ' + run);
      }
    });
  })

  it('stdout', function (done) {
    nodemon.on('stdout', function (data) {
      assert(true, '"stdout" event with: ' + data);
      done();
    });
  });

    // }).on('stderr', function (data) {
    //   assert(true, '"stderr" event with: ' + data);
  it('restart', function (done) {
    nodemon.on('restart', function (files) {
      assert(true, '"restart" event with ' + files);
      assert(files[0] === appjs, 'restart due to ' + files.join(' ') + ' changing');
      done();
    });
  });

  utils.port++;
  nodemon({
    script: appjs,
    verbose: true,
    stdout: false,
    noReset: true,
    env: { PORT: utils.port, USER: 'nodemon' },
  });


});