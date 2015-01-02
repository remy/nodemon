'use strict';
/*global describe:true, it: true */
var changedSince = require('../../lib/monitor/changed-since'),
    touch = require('touch'),
    assert = require('assert'),
    utils = require('../utils'),
    appjs = utils.appjs;

describe('change monitor', function () {
  var start = Date.now(),
      dir = process.cwd();

  it('should return empty if nothing has changed', function (done) {
    // give it a moment after we got the start time of the test
    setTimeout(function () {
      touch.sync(appjs);
    }, 1000);

    setTimeout(function () {
      start = Date.now();
      changedSince(start, dir, function (files) {
        assert(files.length === 0, 'expected zero files, ' + JSON.stringify(files));
        done();
      });
    }, 2000);
  });

  it('should return the file that was changed after the timestamp', function (done) {
    start = Date.now();
    setTimeout(function () {
      touch.sync(appjs);
    }, 1000);

    setTimeout(function () {
      changedSince(start, dir, function (files) {
        assert(files.length === 1, 'one file changed');
        assert(files[0] === appjs, 'app.js changed');
        done();
      });
    }, 2000);
  });

});