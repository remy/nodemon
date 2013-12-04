/*global describe:true, it: true */
var cli = require('../../lib/cli/'),
    exec = require('../../lib/config/exec'),
    pkg = require('../../package'),
    assert = require('assert'),
    command = require('../../lib/monitor/run').command;

function asCLI(cmd) {
  return ('node nodemon ' + cmd).trim();
}

function parse(cmd) {
  var parsed = cli.parse(cmd);
  parsed.execOptions = exec(parsed);
  return parsed;
}

function commandToString(command) {
  return command.executable + (command.args.length ? ' ' + command.args.join(' ') : '');
}

describe('nodemon CLI parser', function () {
  it('should support stand alone `nodemon` command', function () {
    var settings = parse(asCLI(''));

    assert(settings.script === pkg.main);
  });

  it('should put --debug in the right place with coffescript', function () {
    var settings = parse(asCLI('--debug test/fixtures/app.coffee'));

    assert(commandToString(command(settings)) === 'coffee --nodejs --debug test/fixtures/app.coffee');
    assert(settings.execOptions.exec === 'coffee');
  });

  it('should support period path', function () {
    var settings = parse(asCLI('.'));

    assert(commandToString(command(settings)) === 'node .');
  });

  it('should parse `nodemon lib/index.js`', function () {
    var settings = parse(asCLI('lib/index.js'));

    assert(settings.script === 'lib/index.js');
  });

  it('should parse `nodemon test/fixtures/app.coffee`', function () {
    var settings = parse(asCLI('test/fixtures/app.coffee'));

    assert(settings.script === 'test/fixtures/app.coffee');
    assert(settings.execOptions.exec === 'coffee');
  });

  it('should parse `nodemon --watch src/ -e js,coffee test/fixtures/app.js`', function () {
    var settings = parse(asCLI('--watch src/ -e js,coffee test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
  });

  it('should pass --debug to node', function () {
    var settings = parse(asCLI('--debug test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
    assert(settings.nodeArgs[0] === '--debug');
  });
});

describe('nodemon with CoffeeScript', function () {
  it('should not add --nodejs by default', function () {
    var settings = parse(asCLI('test/fixtures/app.coffee'));
    assert(settings.execOptions.exec === 'coffee', 'executable is coffee');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') === -1, 'is not using --nodejs');
  });

  it('should add --nodejs when used with --debug', function () {
    var settings = parse(asCLI('--debug test/fixtures/app.coffee'));
    assert(settings.execOptions.exec === 'coffee', 'executable is coffee');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(settings.execOptions.execArgs.indexOf('--debug') !== -1, '--debug being used');
  });

  it('should add --nodejs when used with --debug-brk', function () {
    var settings = parse(asCLI('--debug-brk test/fixtures/app.coffee'));
    assert(settings.execOptions.exec === 'coffee', 'executable is coffee');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(settings.execOptions.execArgs.indexOf('--debug-brk') !== -1, '--debug-brk being used');
  });
});