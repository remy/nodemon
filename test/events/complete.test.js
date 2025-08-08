'use strict';
/* global describe, it, beforeEach, before, after */
const nodemon = require('../../lib/');
const debug = require('debug')('nodemon');
const assert = require('assert');
const path = require('path');
const touch = require('touch');
const utils = require('../utils');
const dir = path.resolve(__dirname, '..', 'fixtures', 'events');
const appjs = path.resolve(dir, 'env.js');
const asCLI = utils.asCLI;
const fork = require('child_process').fork;

describe('events should follow normal flow on user triggered change', function () {
  function conf() {
    utils.port++;
    return {
      script: appjs,
      verbose: true,
      stdout: false,
      noReset: true,
      ext: 'js',
      env: {
        PORT: utils.port,
        NODEMON_ENV: 'nodemon',
      },
    };
  }

  const cwd = process.cwd();

  beforeEach(function (done) {
    debug('beforeEach');
    nodemon
      .once('exit', function () {
        nodemon.reset(done);
      })
      .emit('quit');
  });

  before(function () {
    process.chdir(dir);
  });

  after(function (done) {
    debug('after');
    process.chdir(cwd);
    nodemon
      .once('exit', function () {
        nodemon.reset(function () {
          setTimeout(done, 1000);
        });
      })
      .emit('quit');
  });

  it('start', function (done) {
    debug('start');
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
    const plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });
    let run = 0;

    nodemon(conf())
      .on('exit', function () {
        plan.assert(true, '"exit" event');
        if (run === 1) {
          setTimeout(function () {
            plan.assert(true, 'restarting ' + appjs);
            touch.sync(appjs);
          }, 1500);
        } else if (run === 2) {
          plan.assert(true, 'finished');
        } else {
          plan.assert(false, 'quit too many times: ' + run);
        }
      })
      .on('start', function () {
        run++;
      });
  });

  it('stdout', function (done) {
    nodemon(conf()).once('stdout', function (data) {
      assert(true, '"stdout" event with: ' + data);
      done();
    });
  });

  it('restart', function (done) {
    const plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });

    nodemon(conf())
      .on('restart', function (files) {
        plan.assert(true, '"restart" event with ' + files);
        plan.assert(
          files[0] === appjs,
          'restart due to ' + files.join(' ') + ' changing'
        );
      })
      .once('exit', function () {
        plan.assert(true, '"exit" event');
        setTimeout(function () {
          plan.assert(true, 'restarting');
          touch.sync(appjs);
        }, 1500);
      });
  });
});
