/*global describe:true, it: true */
const colour = require('../../lib/utils/colour'),
    assert = require('assert');

describe('utils colour', function () {
  it('should colour strings', function () {
    const red = colour('red', 'foo');
    assert(red.indexOf('\x1B') !== -1);
  });

  it('should strip colours strings', function () {
    const red = colour('red', 'foo');

    const plain = colour.strip(red);
    assert(plain.indexOf('\x1B') === -1);
  });
});