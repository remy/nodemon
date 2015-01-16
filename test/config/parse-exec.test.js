'use strict';
/*global describe:true, it: true, after: true */
var parseExecutable = require('../../lib/config/exec').parseExecutable,
    assert = require('assert');

describe('exec.parseExecutable', function () {
  it('should parse simple commands', function () {
    var cmd = 'run.js';
    var result = parseExecutable(cmd);
    assert(result.exec === cmd, result.exec);
  });

  it('should parse simple commands with space separated arguments', function () {
    var cmd = 'run.js --arg1 --arg2';
    var result = parseExecutable(cmd);
    assert(result.exec === 'run.js', result.exec);
    assert(result.execArgs.length === 1, 'args.length ' + result.execArgs.length);
    assert(result.execArgs[0] === '--arg1 --arg2', result.execArgs[0]);
  });

  it('should leave escaped characters alone', function () {
    var cmd = 'test/fixtures/some \\file'
    var result = parseExecutable(cmd);
    assert(result.exec === 'test/fixtures/some', 'exec: ' + result.exec);
    assert(result.execArgs[0] === '\\file', 'arg: ' + result.execArgs[0]);
  });

  it('should maintain space separated commands', function () {
    var cmd = 'test/fixtures/some\\ \\file';
    var result = parseExecutable(cmd);
    assert(result.exec === cmd, 'exec: ' + result.exec);
    assert(result.execArgs.length === 0, 'arg: ' + JSON.stringify(result.execArgs));
  });

  it('should handle test/fixtures/some\\\"file', function () {
    var cmd = 'test/fixtures/some\\\"file';
    var result = parseExecutable(cmd);
    assert(result.exec === cmd, 'exec: ' + result.exec);
    assert(result.execArgs.length === 0, 'arg: ' + JSON.stringify(result.execArgs));
  });

  it('should handle some\\\"file\\" "and some"', function () {
    var cmd = 'some\\\"file\\" "and some"';
    var result = parseExecutable(cmd);
    assert(result.exec === 'some\\\"file\\"', 'exec: ' + result.exec);
  });

  it('should handle "test/fixtures/app with spaces.js" foo', function () {
    var cmd = '"test/fixtures/app with spaces.js" foo';
    var result = parseExecutable(cmd);
    assert(result.exec === '"test/fixtures/app with spaces.js"', 'exec: ' + result.exec);
  });

  // it('should handle echo -e "line1\\nline2"', function () {
  //   var cmd = '"echo -e \"line1\\nline2\""';
  //   var result = parseExecutable(cmd);
  //   assert(result.exec === cmd, 'exec: ' + result.exec);
  // });

  it('should handle simple spaces: test/fixtures/app\\ with\\ spaces.js', function () {
    var cmd = 'test/fixtures/app\\ with\\ spaces.js';
    var result = parseExecutable(cmd);
    assert(result.exec === cmd, 'exec: ' + result.exec);
  });
});
