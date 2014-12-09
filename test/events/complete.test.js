'use strict';
/*global describe:true, it: true, afterEach: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'env.js');

describe('events should follow normal flow on user triggered change', function () {
  function conf() {
    utils.port++;
    return {
      script: appjs,
      verbose: true,
      stdout: false,
      noReset: true,
      env: { PORT: utils.port, USER: 'nodemon' },
    };
  }

  beforeEach(function (done) {
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  after(function (done) {
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  it('start', function (done) {
    nodemon(conf()).once('start', function () {
      assert(true, '"start" event');
      done();
    });
  });

  it('config:update', function (done) {
    nodemon(conf()).on('config:update', function () {
      assert(true, '"config:update" event');
      done();
    });
  });

  it('exit', function (done) {
    var plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });
    var run = 0;
    nodemon(conf()).on('exit', function () {
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
    }).on('start', function () {
      run++;
    });
  })

  it('stdout', function (done) {
    nodemon(conf()).on('stdout', function (data) {
      assert(true, '"stdout" event with: ' + data);
      done();
    });
  });

  it('restart', function (done) {
    var plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });

    nodemon(conf()).on('restart', function (files) {
      assert(true, '"restart" event with ' + files);
      assert(files[0] === appjs, 'restart due to ' + files.join(' ') + ' changing');
    }).on('exit', function () {
      plan.assert(true, '"exit" event');
      setTimeout(function () {
        plan.assert(true, 'restarting');
        touch.sync(appjs);
      }, 1000);
    });
  });
});