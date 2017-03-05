'use strict';
/*global describe:true, it: true, after: true */
var nodemon = require('../../../lib/'),
    utils = require('../../utils'),
    path = require('path'),
    assert = require('assert');

describe('when nodemon runs (1)', function () {
  var tmp = path.resolve('test/fixtures/env.js');

  afterEach(utils.reset);

  it('should pass through environment values', function (done) {
    this.timeout(5000);

    nodemon({ script: tmp, stdout: false, env: { USER: 'nodemon' } }).on('stdout', function (data) {
      assert(data.toString().trim() === 'nodemon', 'USER env value correctly set to "nodemon": ' + data.toString());

      done();
    });
  });
});
