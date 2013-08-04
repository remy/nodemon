/*global describe:true, it: true */
var executable = require('../../lib/cli/exec'),
    assert = require('assert');

describe('nodemon executable', function () {
  it('should default to node', function () {
    var options = executable('index.js');

    assert(options.exec === 'node');
    assert(options.ext === '.js');
  });

  it('should use coffeescript on .coffee', function () {
    var options = executable('index.coffee');

    assert(options.exec === 'coffee');
    assert(options.ext.indexOf('.coffee') !== -1);
  });
});