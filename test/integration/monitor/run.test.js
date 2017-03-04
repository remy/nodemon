'use strict';
/*global describe:true, it: true, after: true, beforeEach */
var nodemon = require('../../../lib/');
var assert = require('assert');
var utils = require('../../utils');
var fs = require('fs');
var path = require('path');
var touch = require('touch');
var crypto = require('crypto');

function rnd() {
  return crypto.randomBytes(16).toString('hex');
}

describe('when nodemon runs (2)', function () {
  var tmp = path.resolve('test/fixtures/test' + rnd() + '.js');
  var dynamicOne;

  afterEach(utils.reset);

  afterEach(function() {
    fs.unlinkSync(tmp);

    if (typeof dynamicOne !== 'undefined') {
      fs.unlinkSync(dynamicOne);
      dynamicOne = undefined;
    }
  });

  beforeEach(nodemon.reset);

  it('should restart when new files are added', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function() {}, 10000)');
    dynamicOne = path.resolve('test/fixtures/test' + rnd() + '-added.js');

    nodemon({
      script: tmp,
    }).on('start', function () {
      setTimeout(function () {
        fs.writeFileSync(dynamicOne, 'setTimeout(function() {}, 10000)');
      }, 500);
    }).on('restart', function () {
      assert(true, 'restarted after new file was added');
      nodemon.once('exit', done).emit('quit');
    });
  });

  it('should wait when the script crashes', function (done) {
    fs.writeFileSync(tmp, 'throw Error("forced crash")');

    nodemon({
      script: tmp,
      stdout: false
    }).on('crash', function () {
      assert(true, 'detected crashed state');

      setTimeout(function () {
        fs.writeFileSync(tmp, 'var n = 10 + 2;');
      }, 1000);
    }).on('restart', function () {
      assert(true, 'nodemon restarted');
      done();
    });
  });

  it('should wait when the script cleanly exits', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function () { var n = 10; }, 1000)');

    nodemon({ script: tmp }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).on('exit', function () {
      assert(true, 'nodemon is waiting for a change');

      setTimeout(function () {
        touch.sync(tmp);
      }, 500);
    }).on('restart', function () {
      assert(true, 'nodemon restarted');
      done();
    });
  });

  it('should expose readable streams when stdout is false', function (done) {
    var stdoutTestData = 'outputting some data';
    var stderrTestData = 'outputting an error';

    var script = 'setTimeout(function () { console.log("' + stdoutTestData +
      '"); }, 5); setTimeout(function () { console.error("' + stderrTestData +
      '"); }, 10);';

    fs.writeFileSync(tmp, script);

    var stdoutFileName = 'test/fixtures/stdout.txt';
    var stderrFileName = 'test/fixtures/stderr.txt';

    var stdoutWritable = fs.createWriteStream(stdoutFileName);
    var stderrWritable = fs.createWriteStream(stderrFileName);

    nodemon({
      script: tmp,
      stdout: false,
    }).on('crash', function () {
      assert(false, 'detected crashed state');

    }).on('readable', function () {
      this.stdout.pipe(stdoutWritable);
      this.stderr.pipe(stderrWritable);

    }).on('end', function () {
      this.stdout.unpipe(stdoutWritable);
      this.stderr.unpipe(stderrWritable);
      stdoutWritable.end();
      stderrWritable.end();

      var stdoutWritableResult = fs.readFileSync(stdoutFileName);
      var stderrWritableResult = fs.readFileSync(stderrFileName);

      assert(stdoutWritableResult === stdoutTestData,
        'stdout has been piped correctly');
      assert(stderrWritableResult === stderrTestData,
        'stderr has been piped correctly');

      this.emit('quit');

    }).once('exit', function () {
      assert(true, 'nodemon is quitting');

      fs.unlinkSync(stdoutFileName);
      fs.unlinkSync(stderrFileName);

      nodemon.reset();
      done();
    });
  });

  it('should not run command on startup if runOnChangeOnly is true', function (done) {
    fs.writeFileSync(tmp, 'console.log("testing 1 2 3")');

    nodemon({
      script: tmp,
      runOnChangeOnly: true,
      stdout: false,
    }).on('start', function () {
      assert(false, 'script should not start');
    }).once('exit', function () {
      done();
    });

    setTimeout(function () {
      nodemon.emit('quit');
    }, 1500);
  });
});
