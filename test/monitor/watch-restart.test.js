'use strict';
/*global describe, it, after, afterEach */
let debugLogger = {};
const nodemon = require('../../lib/');
var assert = require('assert');
var fs = require('fs');
var utils = require('../utils');
var path = require('path');
var touch = require('touch');
var crypto = require('crypto');
var baseFilename =
  'test/fixtures/test' + crypto.randomBytes(16).toString('hex');

var WAIT_BEFORE_START = 3000;

describe('nodemon monitor child restart', function () {
  var tmpjs = path.resolve(baseFilename + '.js');
  var tmpmd = path.resolve(baseFilename + '.md');

  function write(both) {
    fs.writeFileSync(tmpjs, 'true;');
    if (both) {
      fs.writeFileSync(tmpmd, '# true');
    }
  }

  var pwd = process.cwd();
  var oldhome = utils.home;

  afterEach(function () {
    debugLogger = {};
    process.chdir(pwd);
    utils.home = oldhome;

    if (fs.existsSync(tmpjs)) {
      fs.unlinkSync(tmpjs);
    }
    if (fs.existsSync(tmpmd)) {
      fs.unlinkSync(tmpmd);
    }
  });

  after(function (done) {
    nodemon
      .once('exit', function () {
        nodemon.reset(done);
      })
      .emit('quit');
  });

  it('should happen when monitoring a single extension', function (done) {
    write();

    setTimeout(function () {
      nodemon({ script: tmpjs, verbose: true, ext: 'js' })
        .on('start', function () {
          setTimeout(function () {
            touch.sync(tmpjs);
          }, 1500);
        })
        .on('restart', function (files) {
          assert(
            files[0] === tmpjs,
            'nodemon restarted because of change to our file' + files
          );
          nodemon
            .once('exit', function () {
              nodemon.reset(done);
            })
            .emit('quit');
        });
    }, WAIT_BEFORE_START);
  });

  it('should happen when monitoring multiple extensions', function (done) {
    write(true);
    setTimeout(function () {
      nodemon({
        script: tmpjs,
        ext: 'js md',
        verbose: true,
      })
        .on('start', function () {
          setTimeout(function () {
            touch.sync(tmpmd);
          }, 1500);
        })
        .on('log', function (event) {
          var msg = event.message;
          if (utils.match(msg, 'changes after filters')) {
            var changes = msg
              .trim()
              .slice(-5)
              .split('/');
            var restartedOn = changes.pop();
            assert(
              restartedOn === '1',
              'nodemon restarted on a single file change'
            );
            nodemon
              .once('exit', function () {
                nodemon.reset(done);
              })
              .emit('quit');
          }
        });
    }, WAIT_BEFORE_START);
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
          watch: ['*.js', 'global'],
        })
          .on('start', function () {
            setTimeout(function () {
              touch.sync(tmpjs);
            }, 1000);
          })
          .on('restart', function (files) {
            assert(
              files.length === 1,
              'nodemon restarted when watching directory'
            );
            nodemon
              .once('exit', function () {
                nodemon.reset(done);
              })
              .emit('quit');
          });
      }, WAIT_BEFORE_START);
    });
  }

  it('should restart when watching directory', function (done) {
    write(true);

    // process.chdir(process.cwd() + '/test/fixtures');

    setTimeout(function () {
      nodemon({
        script: tmpjs,
        verbose: true,
        ext: 'js md',
        watch: ['test/'],
      })
        .on('start', function () {
          setTimeout(function () {
            touch.sync(tmpmd);
          }, 1000);
        })
        .on('restart', function (files) {
          assert(
            files.length === 1,
            'nodemon restarted when watching directory'
          );
          nodemon
            .once('exit', function () {
              nodemon.reset(done);
            })
            .emit('quit');
        });
    }, WAIT_BEFORE_START);
  });

  it('should ignore relative node_modules', done => {
    write(true);

    process.chdir(process.cwd() + '/test/fixtures/1246/app');

    nodemon({
      script: 'index.js',
      watch: ['../'],
    })
      .on('watching', file => {
        assert(
          file.indexOf('/node_modules/') === -1,
          `node_modules found: ${file}`
        );
      })
      .on('start', () => {
        // gentle timeout to wait for the files to finish reading
        setTimeout(() => {
          nodemon
            .once('exit', function () {
              nodemon.reset(done);
            })
            .emit('quit');
        }, 1000);
      });
  });
});
