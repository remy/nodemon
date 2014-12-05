'use strict';
/*global describe:true, it: true, afterEach: true, beforeEach: true, after:true */
var load = require('../../lib/config/load'),
    cli = require('../../lib/cli/'),
    path = require('path'),
    testUtils = require('../utils'),
    utils = require('../../lib/utils'),
    rules = require('../../lib/rules'),
    exec = require('../../lib/config/exec'),
    nodemon = require('../../lib/nodemon'),
    command = require('../../lib/config/command'),
    assert = require('assert');

function asCLI(cmd) {
  return ('node nodemon ' + (cmd|| '')).trim();
}

function parse(cmd) {
  var parsed = cli.parse(cmd);
  parsed.execOptions = exec(parsed);
  return parsed;
}

function commandToString(command) {
  return command.executable + (command.args.length ? ' ' + command.args.join(' ') : '');
}

describe('config load', function () {
  var pwd = process.cwd(),
      oldhome = utils.home;

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  after(function (done) {
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset();
      done();
    }).emit('quit');
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
    nodemon.config.reset();
  });

  it('should remove ignore defaults if user provides their own', function (done) {

    nodemon({
      script: testUtils.appjs,
      verbose: true
    }).on('log', function (event) {
      // console.log(event.colour);
    }).on('start', function () {
      assert.ok(nodemon.config.options.ignore.indexOf('one') !== -1, 'Contains "one" path');
      assert.ok(nodemon.config.options.ignore.indexOf('three') !== -1, 'Contains "three" path');
      // note: we use the escaped format: \\.git
      assert.ok(nodemon.config.options.ignore.indexOf('\\.git') === -1, 'nodemon is not ignoring (default) .git');

      nodemon.on('exit', function () {
        nodemon.reset();
        done();
      });

      setTimeout(function () {
        nodemon.emit('quit');
      }, 1000);
    });
  });

  it('should support old .nodemonignore', function (done) {
    // prevents our test from finding the nodemon.json files
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    utils.home = path.resolve(pwd, 'test/fixtures/legacy');

    var config = {},
        settings = {},
        options = {};

    load(settings, options, config, function (config) {
      assert(config.ignore.length === 5, '5 rules found: ' + config.ignore);
      done();
    });
  });


  it('should read global config', function (done) {
    var config = {},
        settings = { quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      assert(config.verbose, 'we are verbose');

      // ensure global mapping works too
      var options = exec({ script: 'template.jade' }, config.execMap);
      assert(options.exec === 'bin/jade', 'exec used, should be "bin/jade": ' + options.exec);

      done();

    });
  });

  it('should give local files preference', function (done) {
    var config = {},
        settings = { quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert.ok(config.ignore.indexOf('one') !== -1, 'ignore contains "one": ' + config.ignore);
      assert.ok(config.ignore.indexOf('three') !== -1, 'ignore contains "three": ' + config.ignore);
      assert.deepEqual(config.watch, ['four'], 'watch is "four": ' + config.watch);
      done();
    });
  });

  it('should give user specified settings preference', function (done) {
    var config = {},
        settings = { ignore: ['one'], watch: ['one'], quiet: true },
        options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert.deepEqual(config.ignore, ['one'], 'ignore is "one": ' + config.ignore);
      assert.deepEqual(config.watch, ['one'], 'watch is "one": ' + config.watch);
      done();
    });
  });

  it('should give user specified exec preference of package.scripts.start', function (done) {
    process.chdir(path.resolve(pwd, 'test/fixtures/packages/start-and-settings'));
    var config = {},
        settings = parse(asCLI()),
        options = {};
    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
      done();
    });
  });

  it('should support "ext" with "execMap"', function (done) {
    // prevents our test from finding the nodemon.json files
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    utils.home = path.resolve(pwd, 'test/fixtures/legacy');

    var settings = { 'script': './index.js',
          'verbose': true,
          'ignore': ['*/artic/templates/*' ],
          'ext' : 'js coffee json',
          'watch': [ '*.coffee' ],
          'execMap': {'js': 'node --harmony', 'coffee': 'node --harmony', }
        },
        config = {},
        options = {};

    load(settings, options, config, function (config) {
      var cmd = commandToString(command(config));
      assert(cmd === 'node --harmony ./index.js', 'cmd is: ' + cmd);
      done();
    });
  });
});