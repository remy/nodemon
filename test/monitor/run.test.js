'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../lib/'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    touch = require('touch'),
    crypto = require('crypto');

describe('when nodemon runs (2)', function () {
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

  it('should expose readable streams when stdout is false', function (done) {
    var stdoutTestData = 'outputting some data';
    var stderrTestData = 'outputting an error';

    var script = 'setTimeout(function () { console.log("' + stdoutTestData + '"); }, 5);' +
                 'setTimeout(function () { console.error("' + stderrTestData + '"); }, 10);';

    fs.writeFileSync(tmp, script);

    var stdoutFileName = 'test/fixtures/stdout.txt';
    var stderrFileName = 'test/fixtures/stderr.txt';

    var stdoutWritable = fs.createWriteStream(stdoutFileName);
    var stderrWritable = fs.createWriteStream(stderrFileName);

    nodemon({
      script: tmp,
      stdout: false

    }).on('crash', function () {
      assert(false, 'detected crashed state');

    }).on('readable', function() {
      this.stdout.pipe(stdoutWritable);
      this.stderr.pipe(stderrWritable);

    }).on('end', function() {
        stdoutWritable.end();
        stderrWritable.end();

        var stdoutWritableResult = fs.readFileSync(stdoutFileName);
        var stderrWritableResult = fs.readFileSync(stderrFileName);

        assert(stdoutWritableResult === stdoutTestData, 'stdout has been piped correctly');
        assert(stderrWritableResult === stderrTestData, 'stderr has been piped correctly');

        this.emit('quit');

    }).once('exit', function() {
      assert(true, 'nodemon is quitting');

      fs.unlinkSync(stdoutFileName);
      fs.unlinkSync(stderrFileName);

      nodemon.reset();
      done();
    });
  });

  it('should not run command if runOnStartup is false', function(done) {
    fs.writeFileSync(tmp, 'console.log("testing 1 2 3")');

    nodemon({
      script: tmp,
      runOnStartup: false,
      stdout: false
    }).on('stdout', function() {
      assert(false, 'there should not be any stdout');
    }).on('stderr', function() {
      assert(false, 'there should not be any stderr');
    }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).once('exit', function () {
      done();
    });
  });

  // it('should kill child on SIGINT', function (done) {
  //   fs.writeFileSync(tmp, 'setTimeout(function () { var n = 10; }, 10000)');

  //   nodemon({ script: tmp, verbose: true }).on('start', function () {
  //     assert(true, 'nodemon is waiting for a change');

  //     setTimeout(function () {
  //       // process.once('SIGINT', function () {
  //       //   // do nothing
  //       //   console.log('not going to exit');
  //       // });

  //       process.kill(process.pid, 'SIGINT');
  //     }, 1000);
  //   }).on('crash', function () {
  //     assert(false, 'detected crashed state');
  //   }).on('exit', function () {
  //     assert(true, 'quit correctly');
  //     nodemon.reset();
  //     done();

  //     setTimeout(function () {
  //       process.kill(process.pid, 'SIGINT');
  //     }, 1000);

  //   });

  // });
});
