'use strict';
/*global describe:true, it: true, beforeEach, afterEach */
var nodemon = require('../../../lib/');
var assert = require('assert');
var utils = require('../../utils');
var fs = require('fs-extra');
var path = require('path');
var touch = require('touch');
var temp = require('temp');

temp.track();

describe('when nodemon runs', function () {
  var tmpjs, forRestart, tmpdir, newEnv;
  var env = path.resolve('test/fixtures/env.js');

  afterEach(utils.reset);

  beforeEach(function() {
    tmpdir = temp.mkdirSync();
    newEnv = path.resolve(tmpdir, 'env.js');

    fs.copySync(env, newEnv);

    tmpjs = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });
    forRestart = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });
  });

  beforeEach(nodemon.reset);

  it('should pass through environment values', function (done) {
    this.timeout(5000);

    nodemon({
      cwd: tmpdir,
      script: env,
      stdout: false,
      env: { USER: 'nodemon' }
    }).on('stdout', function (data) {
      assert.equal(
        data.toString().trim(),
        'nodemon',
        'USER env value correctly set to "nodemon": ' + data.toString()
      );

      done();
    });
  });

  it('should forRestart when new files are added', function (done) {
    fs.writeFileSync(tmpjs, 'setTimeout(function() {}, 10000)');

    nodemon({
      cwd: tmpdir,
      script: tmpjs,
    }).on('start', function () {
      setTimeout(function () {
        fs.writeFileSync(forRestart, 'setTimeout(function() {}, 10000)');
      }, 500);
    }).on('restart', function () {
      assert(true, 'forRestarted after new file was added');
      nodemon.once('exit', done).emit('quit');
    });
  });

  it('should wait when the script crashes', function (done) {
    this.timeout(5000);

    fs.writeFileSync(tmpjs, 'throw Error("forced crash")');

    nodemon({
      cwd: tmpdir,
      script: tmpjs,
      stdout: false
    }).on('crash', function () {
      assert(true, 'detected crashed state');

      setTimeout(function () {
        fs.writeFileSync(tmpjs, 'var n = 10 + 2;');
      }, 1000);
    }).on('restart', function () {
      assert(true, 'nodemon forRestarted');
      done();
    });
  });

  it('should wait when the script cleanly exits', function (done) {
    this.timeout(5000);

    fs.writeFileSync(tmpjs, 'setTimeout(function () { var n = 10; }, 1000)');

    nodemon({
      cwd: tmpdir,
      script: tmpjs
    }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).on('exit', function () {
      assert(true, 'nodemon is waiting for a change');

      setTimeout(function () {
        touch.sync(tmpjs);
      }, 500);
    }).on('restart', function () {
      assert(true, 'nodemon forRestarted');
      done();
    });
  });

  it('should expose readable streams when stdout is false', function (done) {
    var stdoutTestData = 'outputting some data';
    var stderrTestData = 'outputting an error';

    var script = 'setTimeout(function () { console.log("' + stdoutTestData +
      '"); }, 5); setTimeout(function () { console.error("' + stderrTestData +
      '"); }, 10);';

    fs.writeFileSync(tmpjs, script);

    var stdoutFileName = temp.path({
      dir: tmpdir
    });

    var stderrFileName = temp.path({
      dir: tmpdir
    });

    var stdoutWritable = fs.createWriteStream(stdoutFileName);
    var stderrWritable = fs.createWriteStream(stderrFileName);

    nodemon({
      cwd: tmpdir,
      script: tmpjs,
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
    this.timeout(15000);

    fs.writeFileSync(tmpjs, 'console.log("testing 1 2 3")');

    nodemon({
      cwd: tmpdir,
      script: tmpjs,
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
