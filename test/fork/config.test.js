'use strict';
/*global describe:true, it: true, afterEach:true, beforeEach:true */
const assert = require('assert'),
    utils = require('../utils'),
    path = require('path'),
    match = utils.match,
    cleanup = utils.cleanup,
    run = utils.run;

describe('nodemon full config test', function () {
  const pwd = process.cwd();

  beforeEach(function () {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
  });

  afterEach(function () {
    process.chdir(pwd);
  });

  it('should allow execMap.js to be overridden', function (done) {
    var p = run({ exec: '../../bin/nodemon.js',
                  args: ['-V']
      }, {
      error: function (data) {
        p.send('quit');
        cleanup(p, done, new Error(data));
      },
    });

    p.on('message', function (event) {
      if (event.type === 'log') {
        if (match(event.data.message, 'starting `')) {
          event.data.message.replace(/`(.*)`/, function (all, m) {
            assert(m === 'node --harmony app.js', 'Arguments in the correct order: ' + m);
            // p.send('quit');
            cleanup(p, done);
          });
        }
      }
    });
  });
});