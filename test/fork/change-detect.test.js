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
  var complete = function (p, done, err) {
    p.once('exit', function () {
      done(err);
    });
    p.send('quit');
  };

  it('should restart on .js file changes with no arguments', function (done) {
    var p = run(appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();
          assert(restartedOn === '1', 'nodemon restarted on 1 file');
        }
      },
      error: function (data) {
        complete(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'restart') {
        complete(p, done);
      } else if (event.type === 'start') {
        setTimeout(function () {
          touch.sync(appjs);
        }, 2500);
      }
    });
  });

  it('should NOT restart on non-.js file changes with no arguments', function (done) {
    var p = run(appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();

          assert(restartedOn === '0', 'expects to not have restarted');
          complete(p, done);
        }
      },
      error: function (data) {
        complete(p, done, new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          // touch a different file, but in the same directory
          touch.sync(appcoffee);
        }, 2500);
      } else if (event.type === 'restart') {
        complete(p, done, new Error('nodemon restarted'));
      }
    });
  });
});
