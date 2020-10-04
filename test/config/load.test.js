'use strict';
/*global describe, it, afterEach, beforeEach, after */
var load = require('../../lib/config/load');
var defaults = require('../../lib/config/defaults');
var cli = require('../../lib/cli/');
var path = require('path');
var testUtils = require('../utils');
var utils = require('../../lib/utils');
var rules = require('../../lib/rules');
var exec = require('../../lib/config/exec');
var nodemon = require('../../lib/nodemon');
var command = require('../../lib/config/command');
var assert = require('assert');

function asCLI(cmd) {
  return ('node nodemon ' + (cmd || '')).trim();
}

function commandToString(command) {
  return utils.stringify(command.executable, command.args);
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
      nodemon.reset(done);
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
        nodemon.reset(done);
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
      var options = exec({ script: 'template.pug' }, config.execMap);
      assert(options.exec === 'bin/pug template.pug --out /tmp', 'exec used, should be "bin/pug": ' + options.exec);

      done();

    });
  });

  it('should read package.json config', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/package-json-settings');
    process.chdir(dir);

    var config = {},
      settings = { quiet: true },
      options = {};
    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
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

  it('should give local files preference over package.json config', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/nodemon-settings-and-package-json-settings');
    process.chdir(dir);

    var config = {},
      settings = { quiet: true },
      options = {};
    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
      done();
    });
  });

  it('should give package.json config preference', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/package-json-settings');
    process.chdir(dir);

    var config = {},
      settings = { quiet: true },
      options = {};
    load(settings, options, config, function (config) {
      removeRegExp(config);
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
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
      assert(config.ignore.indexOf('one') !== -1, '"one" is ignored: ' + config.ignore);
      assert.deepEqual(config.watch, ['one'], 'watch is "one": ' + config.watch);
      done();
    });
  });

  it('should give user specified settings preference over package.json config', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/package-json-settings');
    process.chdir(dir);

    var config = {},
      settings = { exec: 'foo-user', quiet: true },
      options = {};
    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo-user', 'exec is "foo-user": ' + config.exec);
      done();
    });
  });

  it('should give user specified exec preference over package.scripts.start', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/start-and-settings');
    process.chdir(dir);

    var config = {},
      settings = { 'script': './index.js', },
      options = {};

    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
      done();
    });
  });

  it('should give package.json specified exec config over package.scripts.start', function (done) {
    var dir = path.resolve(pwd, 'test/fixtures/packages/start-and-package-json-settings');
    process.chdir(dir);

    var config = {},
      settings = {},
      options = {};

    load(settings, options, config, function (config) {
      assert.deepEqual(config.exec, 'foo', 'exec is "foo": ' + config.exec);
      done();
    });
  });

  // it('should put the script at the end if found in package.scripts.start', function (done) {
  //   process.chdir(path.resolve(pwd, 'test/fixtures/packages/start')); // allows us to load text/fixtures/package.json
  //   var settings = cli.parse(asCLI('--harmony'));
  //   var config = {};
  //   var options = {};

  //   load(settings, options, config, function (config) {
  //     var cmd = commandToString(command(config));
  //     assert.equal(cmd, 'node --harmony app.js', 'command is ' + cmd);
  //     done();
  //   });

  // });

  it('should support "ext" with "execMap"', function (done) {
    // prevents our test from finding the nodemon.json files
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    utils.home = path.resolve(pwd, 'test/fixtures/legacy');

    var settings = {
      script: './index.js',
      verbose: true,
      ignore: ['*/artic/templates/*'],
      ext: 'js coffee json',
      watch: ['*.coffee'],
      execMap: { js: 'node --harmony', coffee: 'node --harmony', },
    };
    var config = {};
    var options = {};

    load(settings, options, config, function (config) {
      var cmd = commandToString(command(config));
      assert(cmd === 'node --harmony ./index.js', 'cmd is: ' + cmd);
      done();
    });
  });

  it('should merge ignore rules', function (done) {
    load({
      ignore: ['*/artic/templates/*', 'views/*'],
    }, {}, {}, function (config) {
      assert.equal(config.ignore.length, defaults.ignoreRoot.length + 2);
      done();
    });
  });

  it('should allow user to override ignoreRoot', function (done) {
    load({
      ignore: ['*/artic/templates/*', 'views/*'],
      ignoreRoot: ['.git'],
    }, {}, {}, function (config) {
      assert.equal(config.ignore.length, 3);
      done();
    });
  });

  it('should merge ignore rules even when strings', function (done) {
    load({
      ignore: 'public',
    }, {}, {}, function (config) {
      assert.equal(config.ignore.length, defaults.ignoreRoot.length + 1);
      done();
    });
  });

  it('should allow user to override root ignore rules', function (done) {
    load({
      ignore: 'public',
      ignoreRoot: [],
    }, {}, {}, function (config) {
      assert.equal(config.ignore.length, 1);
      done();
    });
  });

  it('should allow user to set execArgs', done => {
    const execArgs = ['--inspect']
    load({
      execArgs,
    }, {}, {}, config => {
      assert.deepEqual(config.execArgs, execArgs);
      done();
    })
  });

  it('should support pkg.main and keep user args on args', done => {
    process.chdir(path.resolve(pwd, 'test/fixtures/packages/main-and-start'));
    const settings = { scriptPosition: 0, script: null, args: [ 'first', 'second' ] };
    const options = { ignore: [], watch: [], monitor: [] };
    const config = {
      run: false,
      system: { cwd: '/Users/remy/dev/nodemon/issues/1758' },
      required: false,
      dirs: [],
      timeout: 1000,
      options: { ignore: [], watch: [], monitor: [] },
      lastStarted: 0,
      loaded: []
    }

    load(settings, options, config, res => {
      assert.deepEqual(res.execOptions.args, ['first', 'second']);
      done();
    })
  });


});
