'use strict';
/*global describe, it, after, afterEach */
var nodemon = require('../../../lib/'),
    assert = require('assert'),
    fs = require('fs'),
    utils = require('../../utils'),
    path = require('path'),
    touch = require('touch'),
    crypto = require('crypto'),
    baseFilename = 'test/fixtures/test' + crypto.randomBytes(16).toString('hex');

describe('nodemon monitor child restart', function () {
  var tmpjs, tmpmd;

  function write(both) {
    fs.writeFileSync(tmpjs, 'true;');
    if (both) {
      fs.writeFileSync(tmpmd, '# true');
    }
  }

  var pwd = process.cwd(),
      oldhome = utils.home;

  before(function() {
    tmpjs = path.resolve(baseFilename + '.js');
    tmpmd = path.resolve(baseFilename + '.md');
  });

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  afterEach(function(done) {
    // clean up just in case.
    nodemon.once('quit', function() {
    }).once('exit', function () {
      nodemon.reset();

      // Wait until chokidar will actually stop watching files
      setTimeout(function() {
        done();
      }, 500)
    }).emit('quit');
  });

  after(function() {
    if (fs.existsSync(tmpjs)) {
      fs.unlinkSync(tmpjs);
    }

    if (fs.existsSync(tmpmd)) {
      fs.unlinkSync(tmpmd);
    }
  });

  it('should happen when monitoring a single extension', function (done) {
    write();

    setTimeout(function () {
      nodemon({ script: tmpjs, verbose: true, ext: 'js' }).on('start', function () {
        setTimeout(function () {
          touch.sync(tmpjs);
        }, 1500);
      }).on('restart', function (files) {
        assert(files[0] === tmpjs, 'nodemon restarted because of change to our file' + files);

        done();
      });
    }, 2000);
  });

  it('should happen when monitoring multiple extensions', function (done) {
    write(true);
    setTimeout(function () {

      nodemon({
        script: tmpjs,
        ext: 'js md',
        verbose: true
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
      write(true);

      process.chdir('test/fixtures');

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
    write(true);

    setTimeout(function () {
      nodemon({
        script: tmpjs,
        verbose: true,
        ext: 'js md',
        watch: ['test/fixtures/']
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
