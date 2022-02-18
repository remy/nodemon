'use strict';
/*global describe:true, it: true */
const utils = require('../utils'),
    assert = require('assert'),
    path = require('path'),
    appjs = path.relative(process.cwd(), path.resolve(__dirname, '..', 'fixtures', 'sigint.js')),
    match = utils.match,
    cleanup = utils.cleanup,
    run = utils.run,
    isRunning = utils.isRunning;

function runAndKill(done, cmdline, exitcb)
{
  let childPID = null;

  var p = run(cmdline, {
    output: function (data) {
      if (match(data, 'pid: ')) {
        data.replace(/pid: (\d+)/, function (_, p1) {
          childPID = p1;
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
    exitcb(childPID);
  });
}

describe('terminal signals', function () {
  it('should kill child with SIGINT', function (done) {
    runAndKill(done, appjs, function (childPID) {
      assert(!isRunning(childPID), 'child is still running at ' + childPID);
      done();
    });
  });

  it('should terminate nodemon (after ~10 seconds)', function (done) {
    runAndKill(done, appjs + ' --dont-exit', function (childPID) {
      // make sure we don't keep abandoned child
      process.kill(childPID, 'SIGTERM');
      done();
    });
  });
});
