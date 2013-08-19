/*global describe:true, it: true */
var cli = require('../../lib/cli/'),
    assert = require('assert'),
    fs = require('fs'),
    cwd = process.cwd();

function asCLI(cmd) {
  return ('node nodemon ' + cmd).trim();
}

describe('nodemon CLI parser', function () {
  it('should parse `nodemon`', function () {
    var settings = cli.parse(asCLI(''));

    assert(settings.userScript === './bin/nodemon.js');
  });

  it('should parse `nodemon lib/index.js`', function () {
    var settings = cli.parse(asCLI('lib/index.js'));

    assert(settings.userScript === 'lib/index.js');
  });

  it('should parse `nodemon test/fixtures/app.coffee`', function () {
    var settings = cli.parse(asCLI('test/fixtures/app.coffee'));
    assert(settings.userScript === 'test/fixtures/app.coffee');

    assert(settings.options.exec === 'coffee');
  });

  it('should parse `nodemon --watch src/ -e js,coffee test/fixtures/app.js`', function () {
    var settings = cli.parse(asCLI('--watch src/ -e js,coffee test/fixtures/app.js'));

    assert(settings.userScript === 'test/fixtures/app.js');
    assert(settings.options.exec === 'node');
  });

  it('should pass --debug to node', function () {
    var settings = cli.parse(asCLI('--debug test/fixtures/app.js'));

    assert(settings.userScript === 'test/fixtures/app.js');
    assert(settings.options.exec === 'node');
    assert(settings.options.nodeArgs[0] === '--debug');
  });


});