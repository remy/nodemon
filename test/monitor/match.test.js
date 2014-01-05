'use strict';
/*global describe:true, it: true */
var assert = require('assert'),
    match = require('../../lib/monitor/match'),
    config = require('../../lib/config'),
    path = require('path'),
    nodemonUtils = require('../../lib/utils'),
    utils = require('../utils');

describe('match', function () {
  var monitor = [
    '!.git',
    '!node_modules/*',
    '!public/*',
    '!npm-debug.log',
    '!node_modules/*',
    'views/server/*.coffee',
    '!*.coffee',
  ];

  it('should return based on number of slashes in monitor rules', function () {
    var files = [ 'views/server/remy.coffee', 'random.coffee', '/User/remy/app/server/foo.coffee' ];

    var results = match(files, monitor); // ignoring extension support
    assert(results.result.length === 1, 'expecting 1 file in good');
  });

  it('should apply *.js to any js file', function () {
    var files = [utils.appjs];

    var result = match(files, ['*.*'], 'js');

    assert.deepEqual(result.result, files, 'file returned from match, matches');
    assert(result.ignored === 0, 'no files were ignored');
    assert(result.watched === files.length, 'a single file was matched');
  });

  it('should ignore .coffee if watching *.js', function () {
    var files = [utils.appcoffee];

    var result = match(files, ['*.*'], 'js');

    assert.deepEqual(result.result, [], 'no results returned');
  });

  it('should match .coffee if watching *.js & *.coffee', function (done) {
    config.load({
      ext: 'js coffee'
    }, function (config) {
      var files = [utils.appcoffee];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files, 'coffee file matched');
      assert(result.ignored === 0, '0 files ignored');
      done();
    });
  });

  it('should ignore nodemon default rules', function (done) {
    config.load({ ext: '*.js' }, function (config) {

      var files = [utils.appjs, path.join(__dirname, '/.git/foo.js')];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files.slice(0, 1), 'first file matched');
      assert(result.ignored === 1, '.git file was ignored');
      assert(result.watched === 1, 'a single file was matched');

      done();
    });

  });

  it('should ignore directories', function (done) {
    config.load({
      ext: 'js',
      ignore: 'test/fixtures'
    }, function (config) {
      var files = [utils.appjs];

      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'should be no files matched');
      done();
    });
  });

  it('should check all directories by default', function (done) {
    config.load({
      ext: 'js'
    }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);
      assert.deepEqual(result.result, files, 'results should match');
      done();
    });
  });

  it('should support old .nodemonignore', function (done) {
    // prevents our test from finding the nodemon.json files
    var pwd = process.cwd(),
        old = nodemonUtils.home;

    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    nodemonUtils.home = path.resolve(pwd, 'test/fixtures/legacy');

    // will load the legacy file format
    config.load({ script: utils.appjs, ext: 'js json' }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, files, 'allows app.js: ' + result.result);

      files = [path.resolve(pwd, 'test/fixtures/app.json')];
      result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'nothing matched' + result.result);

      process.chdir(pwd);
      nodemonUtils.home = old;
      done();
    });
  });



  it('should be specific about directories', function (done) {
    config.load({
      ext: 'js md jade',
      watch: ['lib']
    }, function (config) {
      var files = [utils.appjs];
      var result = match(files, config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'no results');
      done();
    });
  });

  it('should not match coffee when monitoring just js', function (done) {
    config.load({
      script: utils.appjs
    }, function (config) {
      var result = match([utils.appcoffee], config.options.monitor, config.options.execOptions.ext);

      assert.deepEqual(result.result, [], 'no results');
      done();
    });
  });
});