'use strict';
/*global describe:true, it: true, after: true */
var assert = require('assert'),
    fs = require('fs'),
    utils = require('../utils'),
    colour = require('../../lib/utils/colour'),
    appjs = utils.appjs,
    // appcoffee = utils.appcoffee,
    run = utils.run,
    cleanup = utils.cleanup,
    path = require('path'),
    touch = require('touch'),
    crypto = require('crypto'),
    noop = function () {},
    baseFilename = 'test/fixtures/test' + crypto.randomBytes(16).toString('hex');

describe('nodemon fork child restart', function () {
  var tmpjs = path.resolve(baseFilename + '.js'),
      tmpmd = path.resolve(baseFilename + '.md'),
      tmpcoffee = path.resolve(baseFilename + '.coffee');

  after(function () {
    fs.unlink(tmpjs, noop);
    fs.unlink(tmpmd, noop);
    fs.unlink(tmpcoffee, noop);
  });

  /* removed test due to CoffeeScript using depreciate customFds - failing tests */
  // it('should cleanly kill entire process tree', function (done) {
  //   fs.writeFileSync(tmpcoffee, 'true');

  //   var listening = 0;

  //   var p = run('--debug ' + appcoffee, {
  //     error: function (data) {
  //       if (data.indexOf('ebugger listening') === -1) {
  //         p.send('quit');
  //         cleanup(p, done, new Error(data));
  //       }
  //     },
  //     output: function (data) {
  //       if (utils.match(data, 'Listening on port')) {
  //         listening++;
  //         if (listening === 2) {
  //           assert(true, 'nodemon started child successfully twice');
  //           cleanup(p, done);
  //         }
  //       }

  //     }
  //   });

  //   var startedOnce = false;
  //   p.on('message', function (event) {
  //     if (startedOnce === false && event.type === 'start') {
  //       startedOnce = true;
  //       setTimeout(function () {
  //         touch.sync(tmpcoffee);
  //       }, 2000);
  //     } else if (event.type === 'restart') {
  //       assert(true, 'nodemon restarted');
  //     }
  //   });

  // });

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

  it('should happen only once if delay option is set', function (done) {
    var restartCount = 0;
    fs.writeFile(tmpjs, 'true;', function () {
      var p = run('--verbose --ext js --delay 2 ' + tmpjs, {
        error: function (data) {
          p.send('quit');
          cleanup(p, done, new Error(data));
        }
      });

      setTimeout(function () {
        if (restartCount === 1) {
          assert(true, 'nodemon restarted ' + restartCount + ' times');
          cleanup(p, done);
        } else {
          cleanup(p, done, new Error('nodemon started ' + restartCount + ' times'));
        }
      }, 8000);

      p.on('message', function (event) {
        if (event.type === 'log') {
          // console.log(event.data.colour);
        } else {
          // console.log(event.type, Date.now()/1000|0);
        }

        // on first start - kick off timeouts to touch the files
        if (event.type === 'start' && restartCount === 0) {
          setTimeout(function () {
            // console.log('touch 1', Date.now()/1000|0);
            touch.sync(tmpjs);
          }, 1000);
          setTimeout(function () {
            // console.log('touch 2', Date.now()/1000|0);
            touch.sync(tmpjs);
          }, 2000);
          setTimeout(function () {
            // console.log('touch 3', Date.now()/1000|0);
            touch.sync(tmpjs);
          }, 3000);
          setTimeout(function () {
            // console.log('touch 4', Date.now()/1000|0);
            touch.sync(tmpjs);
          }, 4000);
        }

        if (event.type === 'restart') {
          restartCount++;
        }
      });

    });

  });

  it('should happen when monitoring multiple extensions', function (done) {
    fs.writeFileSync(tmpjs, 'true;');
    fs.writeFileSync(tmpmd, '# true');
    var monitor = utils.monitorForChange('changes after filters');
    setTimeout(function () {
      var p = run('--ext js,md ' + appjs, {
        error: function (data) {
          p.send('quit');
          cleanup(p, done, new Error(data));
        },
        output: function (data) {
          var msg = colour.strip(data.trim());
          if (monitor(msg)) {
            var changes = msg.slice(-5).split('/');
            var restartedOn = changes.pop();
            assert(restartedOn === '1', 'nodemon restarted on a single file change: ' + restartedOn);
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
