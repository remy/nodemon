'use strict';
/*global describe:true, it: true, after: true, beforeEach */
import nodemon from '../../lib/index.js';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import touch from 'touch';
import crypto from 'crypto';

function rnd() {
  return crypto.randomBytes(16).toString('hex');
}

describe('when nodemon runs (2)', function () {
  var tmp = path.resolve('test/fixtures/test' + rnd() + '.js');
  var tmp2 = path.resolve('test/fixtures/test' + rnd() + '-added.js');

  afterEach(function () {
    if (fs.existsSync(tmp)) {
      fs.unlinkSync(tmp);
    }
    if (fs.existsSync(tmp2)) {
      fs.unlinkSync(tmp2);
    }
  });

  after(function (done) {
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  beforeEach(function (done) {
    nodemon.reset(done);
  });

  it('should restart when new files are added', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function(){}, 10000)');

    nodemon({
      script: tmp,
    }).on('start', function () {
      setTimeout(function () {
        fs.writeFileSync(tmp2, 'setTimeout(function(){}, 10000)');
      }, 500);
    }).on('restart', function () {
      assert(fs.existsSync(tmp2), 'restarted after new file was added');
      nodemon.once('exit', function () {
        nodemon.reset(done);
      }).emit('quit');
    });
  });

  it('should wait when the script crashes', function (done) {
    fs.writeFileSync(tmp, 'throw Error("forced crash")');

    nodemon({ script: tmp, stdout: false }).on('crash', function () {
      assert(true, 'detected crashed state');

      setTimeout(function () {
        fs.writeFileSync(tmp, 'var n = 10 + 2;');
      }, 1000);
    }).on('restart', function () {
      assert(true, 'nodemon restarted');
      nodemon.once('exit', function () {
        nodemon.reset(done);
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
        nodemon.reset(done);
      }).emit('quit');
    });
  });

  it('should expose readable streams when stdout is false', function (done) {
    var stdoutTestData = 'outputting some data';
    var stderrTestData = 'outputting an error';

    var script = 'setTimeout(function () { console.log("' + stdoutTestData +
      '"); }, 5); setTimeout(function () { console.error("' + stderrTestData +
      '"); }, 10);';

    fs.writeFileSync(tmp, script);

    var stdoutFileName = 'test/fixtures/stdout.txt';
    var stderrFileName = 'test/fixtures/stderr.txt';

    var stdoutWritable = fs.createWriteStream(stdoutFileName);
    var stderrWritable = fs.createWriteStream(stderrFileName);

    nodemon({
      script: tmp,
      stdout: false,
    }).on('crash', function () {
      assert(false, 'detected crashed state');

    }).on('readable', function () {
      this.stdout.pipe(stdoutWritable);
      this.stderr.pipe(stderrWritable);

    }).on('end', function () {
      this.stdout.unpipe(stdoutWritable);
      this.stderr.unpipe(stderrWritable);
      stdoutWritable.end();
      stderrWritable.end();

      var stdoutWritableResult = fs.readFileSync(stdoutFileName);
      var stderrWritableResult = fs.readFileSync(stderrFileName);

      assert(stdoutWritableResult === stdoutTestData,
        'stdout has been piped correctly');
      assert(stderrWritableResult === stderrTestData,
        'stderr has been piped correctly');

      this.emit('quit');

    }).once('exit', function () {
      assert(true, 'nodemon is quitting');

      fs.unlinkSync(stdoutFileName);
      fs.unlinkSync(stderrFileName);

      nodemon.reset(done);
    });
  });

  // Fixed! FIXME this test was previously not working properly
  // corrected the test case
  // script should not be run i.e,
  // file should not be created 
  it('should not run command on startup if runOnChangeOnly is true',
    function (done) {
      var script =  "import touch from 'touch';\n"
                    + "touch.sync(" + tmp2 + ");\n"
      fs.writeFileSync(tmp, script);

      nodemon({
        script: tmp,
        runOnChangeOnly: true,
        stdout: false,
      }).on('start', function () {
        // file exists check
      	assert(!fs.existsSync(tmp2), 'script should not start');
      }).once('exit', function () {
        done();
      });

      setTimeout(function () {
        nodemon.emit('quit');
      }, 1500);
    });

  it('should kill child on SIGINT', function (done) {
    fs.writeFileSync(tmp, 'setTimeout(function () { var n = 10; }, 10000)');

    nodemon({ script: tmp, verbose: true }).on('start', function () {
      assert(true, 'nodemon is waiting for a change');

      setTimeout(function () {
        process.once('SIGINT', function () {
          // do nothing
        });

        process.kill(process.pid, 'SIGINT');
      }, 1000);
    }).on('crash', function () {
      assert(false, 'detected crashed state');
    }).on('exit', function () {
      assert(true, 'quit correctly');
      nodemon.reset(done);

      setTimeout(function () {
        process.kill(process.pid, 'SIGINT');
      }, 1000);
    });
  });
});
