'use strict';
/*global describe:true, it: true */
var stringify = require('../../../lib/utils').stringify,
    assert = require('assert');

describe('stringify', function () {
  it('should combine the executable and arguments', function () {
    var string = stringify('node', ['./app.js', '--flag']);
    var expected = 'node ./app.js --flag';

    assert(string === expected, "stringified to " + string);
  });
  it('should not include excess whitespace', function () {
    var string = stringify('node');
    var expected = 'node';

    assert(string === expected, "stringified to " + string);
  });
  it('should quote arguments with spaces', function () {
    var string = stringify('node', ['./app.js', '--one --two']);
    var expected = 'node ./app.js "--one --two"';

    assert(string === expected, "stringified to " + string);
  });
  it('should escape quotes', function () {
    var string = stringify('node', ['./app.js', '--one "--two --three"']);
    var expected = 'node ./app.js "--one \\"--two --three\\""';

    assert(string === expected, "stringified to " + string);
  });
});
