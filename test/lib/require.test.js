'use strict';
/*global describe:true, it: true, afterEach: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    path = require('path'),
    touch = require('touch'),
    utils = require('../utils'),
    getPort = require('get-port'),
    appjs = path.resolve(__dirname, '..', 'fixtures', 'app.js'),
    envjs = path.resolve(__dirname, '..', 'fixtures', 'env.js');

describe('require-able', function () {
  var pwd = process.cwd(),
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
      env: { USER: 'nodemon' },
      stdout: false,
    }).on('stdout', function (data) {
      var out = data.toString().trim();
      assert(out === 'nodemon', 'expected output: ' + out);
      done();
    }).on('error', function (e) {
      assert(false, 'script did not run: ' + e);
      done();
    });
  });

  it('should know nodemon has been required', function () {
    assert(nodemon.config.required, 'nodemon has required property');
  });

  it('should restart on file change with custom signal', function (done) {
    var restarted = false;

    getPort().then((port) => {
      nodemon({ script: appjs, verbose: true, env: { PORT: port }, signal: 'SIGINT' }).on('start', function () {
        setTimeout(function () {
          touch.sync(appjs);
        }, 1000);
      }).on('start', function() {
        if (restarted) {
          setTimeout(function() { nodemon.emit('quit') });
        }
      }).on('restart', function () {
        restarted = true;
      }).on('quit', function () {
        assert(restarted, 'nodemon restarted and quit properly');
        nodemon.reset(done);
      }).on('log', function (event) {
        // console.log(event.message);
      });
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

  /*
  it('should restart a file with spaces', function (done) {
    var restarted = false;

    var found = false;
    utils.port++;
    setTimeout(function () {
      nodemon({
        exec: [path.resolve('fixtures', 'app\\ with\\ spaces.js'), 'foo'],
        verbose: true,
        stdout: false,
      }).on('log', function (e) {
        console.log(e.colour);
      }).on('start', function () {
        setTimeout(function () {
          console.log('touching ' + appjs);
          touch.sync(appjs);
        }, 5000);
      }).on('restart', function () {
        restarted = true;
        nodemon.emit('quit');
      }).on('quit', function () {
        assert(found, 'test for "foo" string in output');
        nodemon.reset(done);
      }).on('stdout', function (data) {
        console.log(data.toString().trim());
        found = data.toString().trim() === 'foo';
      });

    }, 2000);
  });
*/
});
