'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../../lib/');
var utils = require('../../utils');
var path = require('path');
var appjs = path.resolve(__dirname, '../..', 'fixtures', 'watch-count', 'index.js');
var assert = require('assert');
var watchRe = /watching ([\d,]+) files/;

describe('watch count', function () {
  var pwd = process.cwd();

  afterEach(function () {
    // reset the cwd
    process.chdir(pwd);
  });

  after(function (done) {
    // clean up just in case.
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  it('should respect ignore rules', function (done) {
    process.chdir('test/fixtures/watch-count');
    nodemon({ script: appjs, verbose: true }).on('start', function () {
      setTimeout(function () {
        nodemon.once('exit', done).emit('quit');
      }, 200);
    }).on('log', function (data) {
      var match = null;
      var count = 0;
      if (match = data.message.match(watchRe)) {
        count = match[1].replace(',', '') * 1;
        assert(count === 6, 'Watching ' + count + ' files, expecting 6.');
      }
    });
  });
});
