'use strict';
/*global describe:true, it: true, after: true */
var assert = require('assert'),
    fs = require('fs'),
    utils = require('../utils'),
    colour = require('../../lib/utils/colour'),
    appjs = utils.appjs,
    run = utils.run,
    cleanup = utils.cleanup,
    path = require('path'),
    touch = require('touch'),
    crypto = require('crypto'),
    baseFilename = 'test/fixtures/test' + crypto.randomBytes(16).toString('hex');

describe('nodemon fork child restart', function () {
  var tmpjs = path.resolve(baseFilename + '.js'),
      tmpmd = path.resolve(baseFilename + '.md');

  after(function () {
    fs.unlink(tmpjs);
    fs.unlink(tmpmd);
  });

  it('should happen when monitoring a single extension', function (done) {
    fs.writeFileSync(tmpjs, 'true;');

    var p = run('--ext js ' + appjs, {
      error: function (data) {
        p.send('quit');
        cleanup(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          touch.sync(tmpjs);
        }, 1000);
      } else if (event.type === 'restart') {
        assert(true, 'nodemon restarted');
        cleanup(p, done);
      }
    });
  });

  it('should happen when monitoring multiple extensions', function (done) {
    fs.writeFileSync(tmpjs, 'true;');
    fs.writeFileSync(tmpmd, '# true');
    setTimeout(function () {
      var p = run('--ext js,md ' + appjs, {
        error: function (data) {
          p.send('quit');
          cleanup(p, done, new Error(data));
        },
        output: function (data) {
          var msg = colour.strip(data.trim());
          console.log(data.trim());
          if (utils.match(msg, 'changes after filters')) {
            var changes = msg.slice(-5).split('/');
            var restartedOn = changes.pop();
            assert(restartedOn === '1', 'nodemon restarted on a single file change');
            cleanup(p, done);
          }
        }
      });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            touch.sync(tmpmd);
          }, 1000);
        }
      });
    }, 2000);
  });
});