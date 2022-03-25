'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../lib/'),
    path = require('path'),
    assert = require('assert');

describe('when nodemon runs (1)', function () {
  var tmp = path.resolve('test/fixtures/env.js');
  var tmp2 = path.resolve('test/fixtures/path_valid.js');

  after(function (done) {
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  it('should pass through environment values', function (done) {
    nodemon({ script: tmp, stdout: false, env: { USER: 'nodemon' } }).on('stdout', function (data) {
      assert(data.toString().trim() === 'nodemon', 'USER env value correctly set to "nodemon": ' + data.toString());
      nodemon.once('exit', function () {
        nodemon.reset(done);
      }).emit('quit');
    });
  });

  it('should pass a valid path in environment when forking', function (done) {
    // the bug #1989 is triggered when spawning node instead of forking.
    nodemon({ script : tmp2, stdout: false }).on('stdout', function (data) {
      assert(data.toString().trim() === 'OK', 'Path in child process should be valid: outcome ' + data.toString());
      nodemon.once('exit', function () {
        nodemon.reset(done);
      }).emit('quit');
    });
  });

  it('should pass a valid path in environment when spawning', function (done) {
    // the bug #1989 is triggered when spawning node instead of forking.
    nodemon({ script : tmp2, stdout: false, spawn: true }).on('stdout', function (data) {
      assert(data.toString().trim() === 'OK', 'Path in child process should be valid: outcome ' + data.toString());
      nodemon.once('exit', function () {
        nodemon.reset(done);
      }).emit('quit');
    });
  });
});
