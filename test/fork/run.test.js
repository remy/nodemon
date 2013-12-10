/*global describe:true, it: true */
var assert = require('assert'),
    utils = require('../utils'),
    appjs = utils.appjs,
    run = utils.run;

describe('nodemon fork', function () {
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
});