'use strict';
/*global describe:true, it: true, after: true */
import nodemon from '../../lib/index.js';
import path from 'path';
import assert from 'assert';

describe('when nodemon runs (1)', function () {
  var tmp = path.resolve('test/fixtures/env.js');
  after(function (done) {
    // clean up just in case.
    nodemon
      .once('exit', function () {
        nodemon.reset(done);
      })
      .emit('quit');
  });

  it('should pass through environment values', function (done) {
    nodemon({ script: tmp, stdout: false, env: { NODEMON_ENV: 'nodemon' } }).on(
      'stdout',
      function (data) {
        assert(
          data.toString().trim() === 'nodemon',
          'NODEMON_ENV env value correctly set to "nodemon": ' + data.toString()
        );
        nodemon
          .once('exit', function () {
            nodemon.reset(done);
          })
          .emit('quit');
      }
    );
  });
});
