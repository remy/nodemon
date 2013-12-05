/*global describe:true, it: true */
var help = require('../../lib/help'),
    assert = require('assert');

describe('help', function () {
  it('should load index by default', function () {
    var page = help();
    assert(page.indexOf('Usage: nodemon') !== -1, 'shows default help page');
  });

  it('should load specific help topic', function () {
    var page = help('authors');
    assert(page.indexOf('Remy Sharp') !== -1, 'shows specific topic');
  });

  it('should not expose files', function () {
    var page = help('../../test/fixtures/help');
    assert(page.indexOf('" help can\'t be found') !== -1, 'shows help cannot be found');
  });
});