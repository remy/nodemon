'use strict';
/*global describe:true, it: true */
var cli = require('../../lib/cli/'),
    exec = require('../../lib/config/exec'),
    pkg = require('../../package'),
    assert = require('assert'),
    command = require('../../lib/config/command');

function asCLI(cmd) {
  return ('node nodemon ' + (cmd|| '')).trim();
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
  it('should parse the help examples #1', function () {
    var settings = parse(asCLI('test/fixtures/app.js')),
        cmd = commandToString(command(settings));

    assert(cmd === 'node test/fixtures/app.js', 'node test/fixtures/app.js: ' + cmd);
  });

  it('should parse the help examples #2', function () {
    var settings = parse(asCLI('-w ../lib test/fixtures/app.js apparg1 apparg2')),
        cmd = commandToString(command(settings));

    assert.deepEqual(settings.watch, ['../lib'], 'watching ../lib: ' + settings.watch);
    assert.deepEqual(settings.execOptions.args, ['apparg1', 'apparg2'], 'args are corr   ' + settings.execOptions.args);
    assert(cmd === 'node test/fixtures/app.js apparg1 apparg2', 'command is ' + cmd);
  });

  it('should parse the help examples #3', function () {
    var settings = parse(asCLI('--exec python app.py')),
        cmd = commandToString(command(settings));

    assert(cmd === 'python app.py', 'command is ' + cmd);
    assert(settings.execOptions.exec === 'python', 'exec is python');
  });

  it('should parse the help examples #4', function () {
    var settings = parse(asCLI('--exec "make build" -e "styl hbs"')),
        cmd = commandToString(command(settings));

    assert(cmd === 'make build', 'command is ' + cmd);
    assert.deepEqual(settings.execOptions.ext.split(','), ['styl', 'hbs'], 'correct extensions being watched: ' + settings.execOptions.ext);
  });

  it('should parse the help examples #5', function () {
    var settings = parse(asCLI('test/fixtures/app.js -- -L')),
        cmd = commandToString(command(settings));

    assert(cmd === 'node test/fixtures/app.js -L', 'command is ' + cmd);
  });

  it('should put the script at the end if found in package.main', function () {
    var pwd = process.cwd();
    process.chdir('test/fixtures'); // allows us to load text/fixtures/package.json
    var settings = parse(asCLI('--harmony')),
        cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert(cmd === 'node --harmony app.js', 'command is ' + cmd);
  });

  it('should put the script at the end if found in package.scripts.start', function () {
    var pwd = process.cwd();
    process.chdir('test/fixtures/packages/start'); // allows us to load text/fixtures/package.json
    var settings = parse(asCLI('--harmony')),
        cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert(cmd === 'node --harmony app.js', 'command is ' + cmd);
  });

  it('should support default express4 format', function () {
    var pwd = process.cwd();
    process.chdir('test/fixtures/packages/express4'); // allows us to load text/fixtures/package.json
    var settings = parse(asCLI()),
        cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert(cmd === 'node ./bin/www', 'command is "' + cmd + '"');
  });

  it('should support package.scripts.start with args', function () {
    var pwd = process.cwd();
    process.chdir('test/fixtures/packages/browserify'); // allows us to load text/fixtures/package.json
    var settings = parse(asCLI('--debug')),
        cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert(cmd === 'browserify --debug -t hbsfy app.js -o bundle.js', 'command is "' + cmd + '"');
  });

  it('should support quotes around arguments', function () {
    var settings = parse(asCLI('--watch "foo bar"'));
    assert(settings.watch[0] === 'foo bar');
  });

  it('should keep eating arguments that are for nodemon after the script.js', function () {
    var settings = parse(asCLI('--watch "foo bar" test/fixtures/app.js -V --scriptOpt1 -L -- -L'));
    assert.deepEqual(settings.execOptions.args, ['--scriptOpt1', '-L'], 'script args are: ' + settings.execOptions.args.join(' '));
    assert(settings.verbose === true, 'verbose');
    assert(settings.watch[0] === 'foo bar', 'watching "foo bar" dir');
    assert(settings.legacyWatch, 'legacy watch method enabled');
  });

  it('should allow -- to appear anywhere, and still find user script', function () {
    var settings = parse(asCLI('test/fixtures/app.js -- -L'));
    assert(!settings.legacyWatch, '-L arg was passed to script, not nodemon');
    assert.deepEqual(settings.execOptions.args, ['-L'], 'script passed -L via --');
    settings = parse(asCLI('-- test/fixtures/app.js -L'));
    assert.deepEqual(settings.execOptions.args, ['-L'], 'leading -- finds script');
    settings = parse(asCLI('test/fixtures/app.js -L --'));
    assert.deepEqual(settings.execOptions.args, [], '-- is ignored');
    assert(settings.legacyWatch, '-L was passed to nodemon');
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

    assert(commandToString(command(settings)).indexOf('--debug') !== -1);
  });

  it('should pass --harmony to node', function () {
    var settings = parse(asCLI('--harmony test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
    assert(commandToString(command(settings)).indexOf('--harmony') !== -1);
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
    var settings = cli.parse('node nodemon --version --exec java --verbose --quiet --watch fixtures --ignore fixtures --no-stdin --no-exec-shell --delay 5 --legacy-watch --exitcrash --ext jade');
    assert(settings.version, 'version');
    assert(settings.verbose, 'verbose');
    assert(settings.exec === 'java', 'exec');
    assert(settings.quiet, 'quiet');
    assert(settings.stdin === false, 'read stdin');
    assert(settings.execShell === false, 'exec shell');
    assert(settings.exitcrash, 'exit if crash');
    assert(settings.watch[0] === 'fixtures', 'watch');
    assert(settings.ignore[0] === 'fixtures', 'ignore');
    assert(settings.delay === 5000, 'delay 5 seconds');
    assert(settings.legacyWatch, 'legacy watch method');
    assert(settings.ext === 'jade', 'extension is jade');
  });
});

describe('nodemon respects custom "ext" and "execMap"', function () {
  it('should support "ext" and "execMap" for same extension', function () {
    var settings = parse(asCLI('-x "node --harmony" -e "js json coffee" test/fixtures/app.coffee'));
    assert(settings.execOptions.ext.indexOf('js') === 0, 'js is monitored: ' + settings.execOptions.ext);
    assert(settings.execOptions.ext.split(',').length === 3, 'all extensions monitored');
    assert(settings.execOptions.exec.indexOf('node') === 0, 'node is exec: ' + settings.execOptions.exec);
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
    var cmd = commandToString(command(settings));

    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(cmd.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(cmd.indexOf('--debug') !== -1, '--debug being used');
  });

  it('should add --nodejs when used with --debug-brk', function () {
    var settings = parse(asCLI('--debug-brk test/fixtures/app.coffee'));
    var cmd = commandToString(command(settings));

    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(cmd.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(cmd.indexOf('--debug-brk') !== -1, '--debug-brk being used');
  });
});

describe('nodemon --delay argument', function () {
  it('should support an integer value', function () {
    var settings = cli.parse('node nodemon --delay 5');
    assert(settings.delay === 5000, 'delay 5 seconds');
  });

  it('should support a float value', function () {
    var settings = cli.parse('node nodemon --delay 1.2');
    assert(settings.delay === 1200, 'delay 1.2 seconds');
  });

  it('should support a value with a time specifier for seconds (s)', function () {
    var settings = cli.parse('node nodemon --delay 5s');
    assert(settings.delay === 5000, 'delay 5 seconds');
  });

  it('should support a value with a time specifier for milliseconds (ms)', function () {
    var settings = cli.parse('node nodemon --delay 1200ms');
    assert(settings.delay === 1200, 'delay 1.2 seconds');
  });
});
