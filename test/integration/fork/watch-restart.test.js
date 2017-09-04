'use strict';
/*global describe:true, it: true,  beforeEach */
var assert = require('assert'),
    fs = require('fs-extra'),
    utils = require('../../utils'),
    colour = require('../../../lib/utils/colour'),
    run = utils.run,
    cleanup = utils.cleanup,
    touch = require('touch'),
    temp = require('temp');

temp.track();

describe('nodemon fork child restart', function () {
  var tmpjs, tmpmd, tmpdir, appjs, proc;

  beforeEach(function() {
    tmpdir = temp.mkdirSync();
    appjs = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });

    fs.copySync(utils.appjs, appjs);

    tmpjs = temp.path({
      dir: tmpdir,
      suffix: '.js'
    });
    tmpmd = temp.path({
      dir: tmpdir,
      suffix: '.md'
    });
  });

  afterEach(function(done) {
    if (typeof proc === 'undefined') {
      done();
      return;
    }

    cleanup(proc, done);
    proc = undefined;
  });

  it('should happen when monitoring a single extension', function (done) {
    fs.writeFileSync(tmpjs, 'true;');

    proc = run('-w ' + tmpdir + ' --ext js ' + appjs, {
      error: function (data) {
        proc.send('quit');
        new Error(data);
      }
    });

    proc.on('message', function (event) {
      if (event.type === 'start') {
        setTimeout(function() {
          touch.sync(tmpjs);
        });
      } else if (event.type === 'restart') {
        assert(true, 'nodemon restarted');
        done();
      }
    });
  });

  it('should happen only once if delay option is set', function (done) {
    this.timeout(15000);

    var restartCount = 0;
    fs.writeFile(tmpjs, 'true;', function () {
      proc = run('-w ' + tmpdir + ' --verbose --ext js --delay 2 ' + tmpjs, {
        error: function (data) {
          proc.send('quit');
          new Error(data);
        }
      });

      setTimeout(function () {
        assert.equal(restartCount, 1, 'nodemon restarted once');
        done();
      }, 8000);

      proc.on('message', function (event) {
        // on first start - kick off timeouts to touch the files
        if (event.type === 'start' && restartCount === 0) {
          setTimeout(function () {
            assert(true, 'touch 1: ' + Date.now()/1000|0);

            touch.sync(tmpjs);
          }, 1000);
          setTimeout(function () {
            assert(true, 'touch 2: ' + Date.now()/1000|0);

            touch.sync(tmpjs);
          }, 2000);
          setTimeout(function () {
            assert(true, 'touch 3: ' + Date.now()/1000|0);

            touch.sync(tmpjs);
          }, 3000);
          setTimeout(function () {
            assert(true, 'touch 4: ' + Date.now()/1000|0);

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
    this.timeout(7000);

    fs.writeFileSync(tmpjs, 'true;');
    fs.writeFileSync(tmpmd, '# true');
    setTimeout(function () {
      proc = run('-w ' + tmpdir + ' --ext js,md ' + appjs, {
        error: function (data) {
          proc.send('quit');
          new Error(data);
        },
        output: function (data) {
          var msg = colour.strip(data.trim());

          if (utils.match(msg, 'changes after filters (before/after)') === false) {
            return
          }

          var changes = msg.split(/\n/).shift();
          changes = changes.replace(/\s*/gm, '').slice(-5).split('/');

          var restartedOn = changes.pop();
          assert.equal(
            restartedOn,
            '1',
            'nodemon restarted on a single file change: ' + restartedOn + ' -- ' + msg
          );

          done();
        }
      });

      proc.on('message', function (event) {
        if (event.type !== 'start') {
          return;
        }

        setTimeout(function () {
          touch.sync(tmpmd);
        }, 1000);
      });
    }, 2000);
  });
});
