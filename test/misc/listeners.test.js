/*global describe, it, beforeEach */

const nodemon = require('../../lib/');
const assert = require('assert');
const path = require('path');
const dir = path.resolve(__dirname, '..', 'fixtures', 'events');
const appjs = path.resolve(dir, 'env.js');
const async = require('async');

describe('listeners clean up', function () {
  function conf() {
    return {
      script: appjs,
      verbose: true,
      stdout: false,
      noReset: true,
      ext: 'js',
      env: {
        PORT: 0,
        USER: 'nodemon',
      },
    };
  }

  beforeEach(function (done) {
    nodemon.reset(done);
  });

  it('should be able to re-run in required mode, many times, and not leak' +
    'listeners', function (done) {

      function run(n) {
        return function (done) {
          nodemon(conf());
          nodemon.on('start', function () {
            nodemon.on('exit', function () {
              nodemon.reset(done);
            });
          });
        };
      }

      const toRun = '01234567890123456789'.split('').map(run);
      toRun.push(function () {
        done();
      });

      async.series(toRun);

    });
});
