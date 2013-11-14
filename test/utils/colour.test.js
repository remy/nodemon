/*global describe:true, it: true */
var colour = require('../../lib/utils/colour'),
    assert = require('assert');

describe('utils colour', function () {
  it('should colour strings', function () {
    var red = colour('red', 'foo');
    assert(red.indexOf('\x1B') !== -1);
  });

  it('should strip colours strings', function () {
    var red = colour('red', 'foo');

    var plain = colour.strip(red);
    assert(plain.indexOf('\x1B') === -1);
  });
});