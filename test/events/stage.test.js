'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../lib/'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    assert = require('assert');

var showStage = path.resolve('test/fixtures/stage.js');

describe('when nodemon restarts one time or more', function () {
  after(function (done) {
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset();
      done();
    }).emit('quit');
  });

  it('should pass a NODEMON_PROCESS_STAGE value of 2', function (done) {
    var plan = new utils.Plan(3, function () {
      nodemon.reset(done);
    });

    var restarts = 0;

    nodemon({
      script: showStage,
      verbose: true,
      stdout: false,
      noReset: true,
      ext: 'js',
      env: {
        USER: 'nodemon',
      },
    })
    .on('stdout', function (data) {
      if (restarts === 0) {
        plan.assert(data.toString().trim() === '1', 'NODEMON_PROCESS_STAGE is \'1\' on first boot');
      }
      else {
        plan.assert(data.toString().trim() === '2', 'NODEMON_PROCESS_STAGE is \'2\' on subsequent boots');
      }
    })
    .on('exit', function () {
      if (++restarts > 2) {
        return;
      }
      setTimeout(function () {
        touch.sync(showStage);
      }, 100);
    });
  });
});
