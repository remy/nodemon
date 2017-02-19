'use strict';
/*global describe:true, it: true */
var utils = require('../../utils'),
    assert = require('assert'),
    path = require('path'),
    appjs = path.relative(process.cwd(), path.resolve(__dirname, '../..', 'fixtures', 'sigint.js')),
    match = utils.match,
    cleanup = utils.cleanup,
    run = utils.run;

describe('terminal signals', function () {
  it('should kill child with SIGINT (after ~10 seconds)', function (done) {
    var childPID = null;

    var p = run(appjs, {
      output: function (data) {
        if (match(data, 'pid: ')) {
          data.replace(/pid: (\d+)/, function (m) {
            childPID = m;
          });
        }
      },
      error: function (data) {
        assert(false, 'nodemon failed with ' + data);
        cleanup(p, done);
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.kill('SIGINT');
        }, 1000);
      }
    }).on('exit', function () {
      // check if the child process is still running
      try {
        process.kill(childPID, 0);
        assert(false, 'child is still running at ' + childPID);
      } catch (e) {
        assert(true, 'child process was not running');
      }
      done();
    });
  });

});
