/*global describe, it*/
var version = require('../../lib/version'),
    pkg = require('../../package.json'),
    assert = require('assert');

describe('version', function () {
  it('should match package.version', function () {
    assert.equal(version, pkg.version ? 'v' + pkg.version : 'development version');
  });
});