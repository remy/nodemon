'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    touch = require('touch'),
    crypto = require('crypto');

describe('when nodemon runs', function () {
  var tmp = path.resolve('test/fixtures/test' + crypto.randomBytes(16).toString('hex') + '.js');

  after(function (done) {
    fs.unlink(tmp);
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset();
      done();
    }).emit('quit');
  });

  it('should wait when the script crashes', function (done) {
    fs.writeFileSync(tmp, 'throw Error("forced crash")');

    nodemon({ script: tmp }).on('crash', function () {
      assert(true, 'detected crashed state');

      setTimeout(function () {
        fs.writeFileSync(tmp, 'var n = 10 + 2;');
      }, 1000);
    }).on('restart', function () {
      assert(true, 'nodemon restarted');
      nodemon.once('exit', function () {
        nodemon.reset();
        done();
      }).emit('quit');
    });
  });

  it('should wait when the script cleanly exits', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function () { var n = 10; }, 1000)');

    nodemon({ script: tmp }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).on('exit', function () {
      assert(true, 'nodemon is waiting for a change');

      setTimeout(function () {
        touch.sync(tmp);
      }, 500);
    }).on('restart', function () {
      assert(true, 'nodemon restarted');
      nodemon.once('exit', function () {
        nodemon.reset();
        done();
      }).emit('quit');
    });
  });

  it('should kill child on SIGINT', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function () { var n = 10; }, 10000)');

    nodemon({ script: tmp, verbose: true }).on('start', function () {
      assert(true, 'nodemon is waiting for a change');

      setTimeout(function () {
        // process.once('SIGINT', function () {
        //   // do nothing
        //   console.log('not going to exit');
        // });

        process.kill(process.pid, 'SIGINT');
      }, 1000);
    }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).on('exit', function () {
      assert(true, 'quit correctly');
      nodemon.reset();
      done();

      setTimeout(function () {
        process.kill(process.pid, 'SIGINT');
      }, 1000);

    });

  });
});