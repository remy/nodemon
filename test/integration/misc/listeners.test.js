/*global describe, it, beforeEach */

var nodemon = require('../../../lib/');
var assert = require('assert');
var path = require('path');
var dir = path.resolve(__dirname, '../..', 'fixtures', 'events');
var appjs = path.resolve(dir, 'env.js');
var async = require('async');

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

      function run() {
        return function (done) {
          nodemon(conf());

          nodemon.on('start', function () {
            nodemon.on('exit', function () {
              nodemon.reset(done);
              // done(null, id);
            });
          });
        };
      }

      var toRun = '012345678'.split('').map(run);
      toRun.push(function () {
        done();
      });

      async.series(toRun);

    });
});
