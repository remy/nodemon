'use strict';
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
  it('should support quotes around arguments', function () {
    var settings = parse(asCLI('--watch "foo bar"'));
    assert(settings.watch[0] === 'foo bar');
  });

  it('should support arguments from the cli', function () {
    var settings = parse(['node', 'nodemon', '--watch', 'foo bar']);
    assert(settings.watch[0] === 'foo bar');
  });

  it('should support stand alone `nodemon` command', function () {
    var settings = parse(asCLI(''));

    assert(settings.script === pkg.main);
  });

  it('should put --debug in the right place with coffescript', function () {
    var settings = parse(asCLI('--debug test/fixtures/app.coffee'));

    // using indexOf instead of === because on windows
    // coffee is coffee.cmd - so we check for a partial match
    assert(commandToString(command(settings)).indexOf('--nodejs --debug test/fixtures/app.coffee') !== -1);
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
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
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
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

  it('should pass --harmony to node', function () {
    var settings = parse(asCLI('--harmony test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
    assert(settings.nodeArgs[0] === '--harmony');
  });
});

describe('nodemon argument parser', function () {
  it('support strings', function () {
    var settings = cli.parse('node nodemon -v');
    assert(settings.version === true, 'version flag');
  });

  it('should support short versions of flags', function () {
    var settings = cli.parse('node nodemon -v -x java -I -V -q -w fixtures -i fixtures -d 5 -L -e jade');
    assert(settings.version, 'version');
    assert(settings.verbose, 'verbose');
    assert(settings.exec === 'java', 'exec');
    assert(settings.quiet, 'quiet');
    assert(settings.stdin === false, 'read stdin');
    assert(settings.watch[0] === 'fixtures', 'watch');
    assert(settings.ignore[0] === 'fixtures', 'ignore');
    assert(settings.delay === 5000, 'delay 5 seconds');
    assert(settings.legacyWatch, 'legacy watch method');
    assert(settings.ext === 'jade', 'extension is jade');
  });


  it('should support long versions of flags', function () {
    var settings = cli.parse('node nodemon --version --exec java --verbose --quiet --watch fixtures --ignore fixtures --no-stdin --delay 5 --legacy-watch --exitcrash --ext jade');
    assert(settings.version, 'version');
    assert(settings.verbose, 'verbose');
    assert(settings.exec === 'java', 'exec');
    assert(settings.quiet, 'quiet');
    assert(settings.stdin === false, 'read stdin');
    assert(settings.exitcrash, 'exit if crash');
    assert(settings.watch[0] === 'fixtures', 'watch');
    assert(settings.ignore[0] === 'fixtures', 'ignore');
    assert(settings.delay === 5000, 'delay 5 seconds');
    assert(settings.legacyWatch, 'legacy watch method');
    assert(settings.ext === 'jade', 'extension is jade');
  });
});

describe('nodemon with CoffeeScript', function () {
  it('should not add --nodejs by default', function () {
    var settings = parse(asCLI('test/fixtures/app.coffee'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') === -1, 'is not using --nodejs');
  });

  it('should add --nodejs when used with --debug', function () {
    var settings = parse(asCLI('--debug test/fixtures/app.coffee'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(settings.execOptions.execArgs.indexOf('--debug') !== -1, '--debug being used');
  });

  it('should add --nodejs when used with --debug-brk', function () {
    var settings = parse(asCLI('--debug-brk test/fixtures/app.coffee'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(settings.execOptions.execArgs.indexOf('--debug-brk') !== -1, '--debug-brk being used');
  });
});