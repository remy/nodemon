'use strict';
/*global describe:true, it: true, afterEach: true, beforeEach: true */
var load = require('../../lib/config/load'),
    path = require('path'),
    utils = require('../../lib/utils'),
    rules = require('../../lib/rules'),
    exec = require('../../lib/config/exec'),
    assert = require('assert');

describe('config load', function () {
  var pwd = process.cwd(),
      oldhome = utils.home,
      log = utils.clone(utils.log);

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
    utils.log = log;
  });

  function removeRegExp(options) {
    delete options.watch.re;
    delete options.ignore.re;
  }

  beforeEach(function () {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
    utils.home = path.resolve(pwd, ['test', 'fixtures', 'global'].join(path.sep));

    rules.reset();

    utils.quiet();
  });

  it('should support old .nodemonignore', function (done) {
    // prevents our test from finding the nodemon.json files
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    utils.home = path.resolve(pwd, 'test/fixtures/legacy');

    var config = {},
        settings = {},
        options = {};

    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert(config.ignore.length > 0, 'no ignore rules found');
      done();
    });
  });


  it('should read global config', function (done) {
    var config = {},
        settings = { quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert(config.verbose);

      // ensure global mapping works too
      var options = exec({ script: 'template.jade' }, config.execMap);
      assert(options.exec === 'bin/jade', 'correct exec is used');

      done();

    });
  });

  it('should give local files preference', function (done) {
    var config = {},
        settings = { quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert.deepEqual(config.ignore, ['one', 'three']);
      assert.deepEqual(config.watch, ['four']);
      done();
    });
  });

  it('should give user specified settings preference', function (done) {
    var config = {},
        settings = { ignore: ['one'], watch: ['one'], quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert.deepEqual(config.ignore, ['one']);
      assert.deepEqual(config.watch, ['one']);
      done();
    });
  });

});