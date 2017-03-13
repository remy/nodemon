'use strict';
/*global describe, it, afterEach, beforeEach */
var nodemon = require('../../../lib/'),
    assert = require('assert'),
    fs = require('fs'),
    utils = require('../../utils'),
    path = require('path'),
    fs = require('fs-extra'),
    touch = require('touch'),
    temp = require('temp');

temp.track();

describe('nodemon monitor child restart', function () {
  var tmpjs, tmpmd, tmpdir, appjs;

  beforeEach(function() {
    tmpdir = temp.mkdirSync();
    appjs = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });

    fs.copySync(utils.appjs, appjs);

    tmpjs = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });
    tmpmd = temp.path({
      dir: tmpdir,
      suffix: '.md'
    });
  });

  function write(both) {
    fs.writeFileSync(tmpjs, 'true;');
    if (both) {
      fs.writeFileSync(tmpmd, '# true');
    }
  }

  var pwd = process.cwd(),
      oldhome = utils.home;

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  afterEach(utils.reset);

  it('should happen when monitoring a single extension', function (done) {
    this.timeout(10000);

    write();

    setTimeout(function () {
      nodemon({
        script: tmpjs,
        verbose: true,
        ext: 'js',
        watch: [tmpdir]
      }).on('start', function () {
        setTimeout(function () {
          touch.sync(tmpjs);
        }, 1500);
      }).on('restart', function (files) {
        assert.equal(
          files[0],
          tmpjs,
          'nodemon restarted because of change to our file ' + files
        );

        done();
      });
    }, 2000);
  });

  it('should happen when monitoring multiple extensions', function (done) {
    this.timeout(10000);

    write(true);
    setTimeout(function () {

      nodemon({
        cwd: tmpdir,
        script: tmpjs,
        ext: 'js md',
        verbose: true,
        watch:[tmpdir]
      }).on('start', function () {
        setTimeout(function () {
          touch.sync(tmpmd);
        }, 1500);
      }).on('log', function (event) {
        var msg = event.message;
        if (utils.match(msg, 'changes after filters')) {
          var changes = msg.trim().slice(-5).split('/');

          var restartedOn = changes.pop();
          assert(restartedOn === '1', 'nodemon restarted on a single file change');

          done();
        }
      });
    }, 2000);
  });

  if (process.platform === 'darwin') {
    it('should restart when watching directory (mac only)', function (done) {
      this.timeout(10000);

      write(true);

      var globalFixture = path.resolve('test/fixtures/global');

      process.chdir(tmpdir);
      fs.copySync(globalFixture, path.join(tmpdir, 'global'));

      setTimeout(function () {
        nodemon({
          script: tmpjs,
          verbose: true,
          ext: 'js',
          watch: ['*.js', 'global']
        }).on('start', function () {
          setTimeout(function () {
            touch.sync(tmpjs);
          }, 1000);
        }).on('restart', function (files) {
          assert(files.length === 1, 'nodemon restarted when watching directory');

          done();
        });
      }, 2000);
    });
  }


  it('should restart when watching directory', function (done) {
    this.timeout(10000);

    write(true);

    setTimeout(function () {
      nodemon({
        script: tmpjs,
        verbose: true,
        ext: 'js md',
        watch: [tmpdir]
      }).on('start', function () {
        setTimeout(function () {
          touch.sync(tmpmd);
        }, 1000);
      }).on('restart', function (files) {
        assert(files.length === 1, 'nodemon restarted when watching directory');

        done();
      });
    }, 2000);
  });

});
