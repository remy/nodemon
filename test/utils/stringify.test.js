'use strict';
/*global describe:true, it: true */
const stringify = require('../../lib/utils').stringify,
    assert = require('assert');

describe('stringify', function () {
  it('should combine the executable and arguments', function () {
    const string = stringify('node', ['./app.js', '--flag']);
    const expected = 'node ./app.js --flag';

    assert(string === expected, "stringified to " + string);
  });
  it('should not include excess whitespace', function () {
    const string = stringify('node');
    const expected = 'node';

    assert(string === expected, "stringified to " + string);
  });
  it('should quote arguments with spaces', function () {
    const string = stringify('node', ['./app.js', '--one --two']);
    const expected = 'node ./app.js "--one --two"';

    assert(string === expected, "stringified to " + string);
  });
  it('should escape quotes', function () {
    const string = stringify('node', ['./app.js', '--one "--two --three"']);
    const expected = 'node ./app.js "--one \\"--two --three\\""';

    assert(string === expected, "stringified to " + string);
  });
});
