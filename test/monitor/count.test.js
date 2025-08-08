'use strict';
/*global describe:true, it: true, after: true */
const nodemon = require('../../lib/');
const utils = require('../utils');
const path = require('path');
const appjs = path.resolve(__dirname, '..', 'fixtures', 'watch-count', 'index.js');
const assert = require('assert');
const watchRe = /watching ([\d,]+) files/;

describe('watch count', function () {
  const pwd = process.cwd();

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
      const match = null;
      let count = 0;
      if (match = data.message.match(watchRe)) {
        count = match[1].replace(',', '') * 1;
        assert(count === 6, 'Watching ' + count + ' files, expecting 6.');
      }
    });
  });

  it('should not watch directory when given a single file', function (done) {
    process.chdir('test/fixtures/watch-count/');
    const watching = 0;
    nodemon({ script: appjs, verbose: true, watch: appjs }).on('start', function () {
      setTimeout(function () {
        assert(watching === 1, `got ${watching} files`);
        nodemon.once('exit', done).emit('quit');
      }, 200);
    }).on('watching', file => {
      watching++;
    }).on('log', function (data) {
      const match = null;
      let count = 0;
      if (match = data.message.match(watchRe)) {
        count = match[1].replace(',', '') * 1;
        assert(count === 1, `log showing ${count} files`);
      }
    });
  });


  it('should ignore node_modules from any dir', function (done) {
    process.chdir('test/fixtures/watch-count/lib');
    nodemon({ script: appjs, verbose: true, watch: '..' }).on('start', function () {
      setTimeout(function () {
        nodemon.once('exit', done).emit('quit');
      }, 200);
    }).on('log', function (data) {
      const match = null;
      const count = 0;
      if (match = data.message.match(watchRe)) {
        count = match[1].replace(',', '') * 1;
        assert(count === 6, 'Watching ' + count + ' files, expecting 6.');
      }
    });
  });
});
