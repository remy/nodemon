'use strict';
/*global describe:true, it: true, afterEach: true */
const nodemon = require('../../lib/'),
  assert = require('assert'),
  path = require('path'),
  touch = require('touch'),
  utils = require('../utils'),
  appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js'),
  envjs = path.resolve(__dirname, '..', 'fixtures', 'env.js');

describe('require-able', function () {
  const pwd = process.cwd(),
    oldhome = utils.home;

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  beforeEach(function (done) {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test'));
    utils.home = path.resolve(pwd, ['test'].join(path.sep));

    nodemon.reset(done);
  });

  it('should prioritise options over package.start', function (done) {
    process.chdir(path.resolve('fixtures/packages/start-ignored'));

    nodemon({
      script: envjs,
      env: { NODEMON_ENV: 'nodemon' },
      stdout: false,
    })
      .on('stdout', function (data) {
        const out = data.toString().trim();
        assert(out === 'nodemon', 'expected output: ' + out);
        done();
      })
      .on('error', function (e) {
        assert(false, 'script did not run: ' + e);
        done();
      });
  });

  it('should know nodemon has been required', function () {
    assert(nodemon.config.required, 'nodemon has required property');
  });

  it('should restart on file change with custom signal', function (done) {
    let restarted = false;

    utils.port++;
    nodemon({
      script: appjs,
      verbose: true,
      env: { PORT: utils.port },
      signal: 'SIGINT',
    })
      .on('start', function () {
        setTimeout(function () {
          touch.sync(appjs);
        }, 1000);
      })
      .on('start', function () {
        if (restarted) {
          setTimeout(function () {
            nodemon.emit('quit');
          });
        }
      })
      .on('restart', function () {
        restarted = true;
      })
      .on('quit', function () {
        assert(restarted, 'nodemon restarted and quit properly');
        nodemon.reset(done);
      })
      .on('log', function (event) {
        // console.log(event.message);
      });
  });

  it('should be restartable', function (done) {
    let restarted = false;

    nodemon(appjs)
      .on('start', function () {
        setTimeout(function () {
          nodemon.restart();
        }, 1000);
      })
      .on('restart', function () {
        restarted = true;
        nodemon.emit('quit');
      })
      .on('quit', function () {
        assert(restarted);
        nodemon.reset(done);
        // unbind events for testing again
      });
  });
});
