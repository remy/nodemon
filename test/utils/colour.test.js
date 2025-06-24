/*global describe:true, it: true */
import colour from '../../lib/utils/colour.js';
import assert from 'assert';;

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