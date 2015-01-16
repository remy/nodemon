'use strict';
/*global describe:true, it: true */
var utils = require('../utils'),
    colour = require('../../lib/utils/colour'),
    assert = require('assert'),
    touch = require('touch'),
    appjs = utils.appjs,
    appcoffee = utils.appcoffee,
    match = utils.match,
    cleanup = utils.cleanup,
    run = utils.run;

describe('nodemon fork simply running', function () {
  it('should start', function (done) {
    var p = run(appjs, {
      output: function (data) {
        if (match(data, appjs)) {
          assert(true, 'nodemon started');
          cleanup(p, done);
        }
      },
      error: function (data) {
        assert(false, 'nodemon failed with ' + data);
        cleanup(p, done);
      }
    });
  });

});

describe('nodemon fork monitor', function () {
  it('should restart on .js file changes with no arguments', function (done) {
    var startWatch = false;
    var p = run(appjs, {
      output: function (data) {
        if (match(data, 'files triggering change check: test/fixtures/app.js')) {
          startWatch = true;
        }
        if (startWatch && match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).split('changes after filters').pop().split('/');
          var restartedOn = changes.pop();
          assert(restartedOn === '1', 'nodemon restarted on 1 file: ' + restartedOn + ' / ' + data.toString());
        }
      },
      error: function (data) {
        utils.cleanup(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'restart') {
        utils.cleanup(p, done);
      } else if (event.type === 'start') {
        setTimeout(function () {
          touch.sync(appjs);
        }, 2500);
      }
    });
  });

  it('should NOT restart on non-.js file changes with no arguments', function (done) {
    setTimeout(function () {
      var p = run(appjs, {
        output: function (data) {
          if (match(data, 'changes after filters')) {
            var changes = colour.strip(data.trim()).slice(-5).split('/');
            var restartedOn = changes.pop();

            assert(restartedOn === '0', 'expects to not have restarted');
            utils.cleanup(p, done);
          }
        },
        error: function (data) {
          utils.cleanup(p, done, new Error(data));
        }
      });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            // touch a different file, but in the same directory
            touch.sync(appcoffee);
          }, 2500);
        } else if (event.type === 'restart') {
          utils.cleanup(p, done, new Error('nodemon restarted'));
        }
      });
    }, 2000);
  });
});
