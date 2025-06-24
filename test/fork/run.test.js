/*global describe:true, it: true */
import assert from 'assert';
import utils from '../utils.js';,
  appjs = utils.appjs,
  run = utils.run;

describe('nodemon fork', function () {
  it('should not show user-signal', done => {
    var p = run({ exec: 'bin/nodemon.js',
    args: [ '-V', '-x', 'echo running && sleep 20' ] }, {
      error: function (data) {
        p.send('quit');
        if (data.trim().indexOf('signal') !== -1) {
          return done(new Error('Signal incorrectly shown'));
        }

        done(new Error(data));
      },
      output: function (data) {
        if (data.trim().indexOf('signal') !== -1) {
          done(new Error('Signal incorrectly shown'));
        }
      }
    });

    let started = false;
    p.on('message', function (event) {
      if (event.type === 'start') {
        if (!started) {
          p.send('restart');
          started = true;
        } else {
          p.send('quit');
          assert(true, 'nodemon started');
          done();
        }

      }
    });
  });

  it('should start a fork', function (done) {
    var p = run(appjs, {
      error: function (data) {
        p.send('quit');
        done(new Error(data));
      }
    });

    p.on('message', function (event) {
      if (event.type === 'start') {
        p.send('quit');
        assert(true, 'nodemon started');
        done();
      }
    });
  });

  if (!process.env.TRAVIS) {
    it('should start a fork exec with a space without args', function (done) {
      var found = false;
      var p = run({
        exec: 'bin/nodemon.js',
        // make nodemon verbose so we can check the filters being applied
        args: ['-q', '--exec', 'test/fixtures/app\\ with\\ spaces.js']
      }, {
          error: function (data) {
            p.send('quit');
            done(new Error(data));
          },
          output: function (data) {
            // process.stdout.write(data);
            if (data.trim() === 'OK') {
              found = true;
            }
          }
        });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            p.send('quit');
            done();
            assert(found, '"OK" message was found');
          }, 500);
        }
      });
    });

    it('should start a fork exec with a space with args', function (done) {
      var found = false;
      var p = run({
        exec: 'bin/nodemon.js',
        // make nodemon verbose so we can check the filters being applied
        args: ['-q', '--exec', '"test/fixtures/app with spaces.js" foo'],
      }, {
          error: function (data) {
            p.send('quit');
            done(new Error(data));
          },
          output: function (data) {
            if (data.trim() === 'foo') {
              found = true;
            }
          }
        });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            p.send('quit');
            assert(found, '"foo" message found');
            done();
          }, 500);
        }
      });
    });

  }

  it('should start a fork exec with a space with args (escaped)', function (done) {
    var found = false;
    var p = run({
      exec: 'bin/nodemon.js',
      // make nodemon verbose so we can check the filters being applied
      args: ['-q', '--exec', 'test/fixtures/app\\ with\\ spaces.js foo']
    }, {
        error: function (data) {
          p.send('quit');
          done(new Error(data));
        },
        output: function (data) {
          // process.stdout.write(data);
          if (data.trim() === 'foo') {
            found = true;
          }
        }
      });

    p.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function () {
          p.send('quit');
          done();
          assert(found, '"OK" message found');
        }, 500);
      }
    });
  });
});
