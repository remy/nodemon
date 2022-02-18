'use strict';
/*global describe:true, it: true */
const cli = require('../../lib/cli/'),
  exec = require('../../lib/config/exec'),
  pkg = require('../../package'),
  assert = require('assert'),
  command = require('../../lib/config/command'),
  utils = require('../../lib/utils');

const mutateExecOptions = require('../../lib/config/load').mutateExecOptions;

function asCLI(cmd) {
  return ('node nodemon ' + (cmd || '')).trim();
}

function parse(cmd) {
  const parsed = cli.parse(cmd);

  // mirrored based on /lib/config/load.js:36
  parsed.execOptions = exec({
    script: parsed.script,
    exec: parsed.exec,
    args: parsed.args,
    scriptPosition: parsed.scriptPosition,
    nodeArgs: parsed.nodeArgs,
    ext: parsed.ext,
    env: parsed.env
  });

  return parsed;
    return mutateExecOptions(cli.parse(cmd));
}

function commandToString(command) {
  return utils.stringify(command.executable, command.args);
}

describe('nodemon CLI parser', function () {
  it('should support --debug with script detect via package', function () {
    const cwd = process.cwd();
    process.chdir('test/fixtures/packages/express4');
    const settings = parse(asCLI('--debug'));
    const cmd = commandToString(command(settings));
    process.chdir(cwd);
    assert.equal(cmd, 'NODE_ENV=development node ./bin/www --debug');
  });

  it('should replace {{filename}}', function () {
    const settings = parse(asCLI('test/fixtures/app.js --exec "node {{filename}}.tmp" --somethingElse'));
    const cmd = commandToString(command(settings));
    assert(cmd === 'node test/fixtures/app.js.tmp --somethingElse', cmd);
  });

  it('should replace {{filename}} multiple times', function () {
    const settings = parse(asCLI('test/fixtures/app.js --exec "node {{filename}}.tmp {{filename}}.tmp" --somethingElse'));
    const cmd = commandToString(command(settings));
    assert(cmd === 'node test/fixtures/app.js.tmp test/fixtures/app.js.tmp --somethingElse', cmd);
  });

  it('should parse the help examples #1', function () {
    const settings = parse(asCLI('test/fixtures/app.js')),
      cmd = commandToString(command(settings));

    assert(cmd === 'node test/fixtures/app.js', 'node test/fixtures/app.js: ' + cmd);
  });

  it('should parse the help examples #2', function () {
    const settings = parse(asCLI('-w ../lib test/fixtures/app.js apparg1 apparg2')),
      cmd = commandToString(command(settings));

    assert.deepEqual(settings.watch, ['../lib'], 'watching ../lib: ' + settings.watch);
    assert.deepEqual(settings.execOptions.args, ['apparg1', 'apparg2'], 'args are corr   ' + settings.execOptions.args);
    assert(cmd === 'node test/fixtures/app.js apparg1 apparg2', 'command is ' + cmd);
  });

  it('should parse the help examples #3', function () {
    const settings = parse(asCLI('--exec python app.py')),
      cmd = commandToString(command(settings));

    assert(cmd === 'python app.py', 'command is ' + cmd);
    assert(settings.execOptions.exec === 'python', 'exec is python');
  });

  it('should parse the help examples #4', function () {
    const settings = parse(asCLI('--exec "make build" -e "styl hbs"')),
      cmd = commandToString(command(settings));

    assert(cmd === 'make build', 'command is ' + cmd);
    assert.deepEqual(settings.execOptions.ext.split(','), ['styl', 'hbs'], 'correct extensions being watched: ' + settings.execOptions.ext);
  });

  it('should parse the help examples #5', function () {
    const settings = parse(asCLI('test/fixtures/app.js -- -L')),
      cmd = commandToString(command(settings));

    assert(cmd === 'node test/fixtures/app.js -L', 'command is ' + cmd);
  });

  it('should put the script at the end if found in package.main', function () {
    const pwd = process.cwd();
    process.chdir('test/fixtures'); // allows us to load text/fixtures/package.json
    const settings = parse(asCLI('--harmony')),
      cmd = commandToString(command(settings));
    process.chdir(pwd);

    assert(cmd === 'node --harmony app.js', 'command is ' + cmd);
  });

  it('should support default express4 format', function () {
    const pwd = process.cwd();
    process.chdir('test/fixtures/packages/express4'); // allows us to load text/fixtures/package.json
    const settings = parse(asCLI()),
      cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert.equal(cmd, 'NODE_ENV=development node ./bin/www', 'command is "' + cmd + '"');
  });

  it('should support spaces', function () {
    const pwd = process.cwd();
    process.chdir('test/fixtures/');
    const settings = parse(asCLI('--exec \'"app with spaces.js" foo\''));
    const cmd = commandToString(command(settings));

    process.chdir(pwd);

    assert(cmd === '"app with spaces.js" foo', cmd);
  });


  it('should support quotes around arguments', function () {
    const settings = parse(asCLI('--watch "foo bar"'));
    assert(settings.watch[0] === 'foo bar');
  });

  it('should keep eating arguments that are for nodemon after the script.js', function () {
    const settings = parse(asCLI('--watch "foo bar" test/fixtures/app.js -V --scriptOpt1 -- -V'));
    assert.deepEqual(settings.execOptions.args, ['--scriptOpt1', '-V'], 'script args are: ' + settings.execOptions.args.join(' '));
    assert(settings.verbose === true, 'verbose');
    assert(settings.watch[0] === 'foo bar', 'watching "foo bar" dir');
  });

  it('should allow -- to appear anywhere, and still find user script', function () {
    let settings = parse(asCLI('test/fixtures/app.js -- -V'));
    assert(!settings.verbose, '-V arg was passed to script, not nodemon');
    assert.deepEqual(settings.execOptions.args, ['-V'], 'script passed -V via --');
    settings = parse(asCLI('-- test/fixtures/app.js -V'));
    assert.deepEqual(settings.execOptions.args, ['-V'], 'leading -- finds script');
    settings = parse(asCLI('test/fixtures/app.js -V --'));
    assert.deepEqual(settings.execOptions.args, [], '-- is ignored');
    assert(settings.verbose, '-V was passed to nodemon');
  });

  it('should support arguments from the cli', function () {
    const settings = parse(['node', 'nodemon', '--watch', 'foo bar']);
    assert(settings.watch[0] === 'foo bar');
  });

  it('should support stand alone `nodemon` command', function () {
    const settings = parse(asCLI(''));
    assert(settings.execOptions.script === pkg.main + '.js', `${settings.execOptions.script} === ${pkg.main}`);
  });

  it('should put --debug in the right place with coffescript', function () {
    const settings = parse(asCLI('--debug test/fixtures/app.coffee'));

    // using indexOf instead of === because on windows
    // coffee is coffee.cmd - so we check for a partial match
    assert(commandToString(command(settings)).indexOf('--nodejs --debug test/fixtures/app.coffee') !== -1);
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
  });

  it('should support period path', function () {
    const settings = parse(asCLI('.'));

    assert(commandToString(command(settings)) === 'node .');
  });

  it('should parse `nodemon lib/index.js`', function () {
    const settings = parse(asCLI('lib/index.js'));

    assert(settings.script === 'lib/index.js');
  });

  it('should parse `nodemon --config my/.nodemon.json server.js`', function () {
    const settings = parse(asCLI('--config my/.nodemon.json test/fixtures/app.js'));

    assert(settings.configFile === 'my/.nodemon.json');
    assert(settings.script === 'test/fixtures/app.js');
  });

  it('should parse `nodemon test/fixtures/app.coffee`', function () {
    const settings = parse(asCLI('test/fixtures/app.coffee'));

    assert(settings.script === 'test/fixtures/app.coffee');
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
  });

  it('should parse `nodemon --watch src/ -e js,coffee test/fixtures/app.js`', function () {
    const settings = parse(asCLI('--watch src/ -e js,coffee test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
  });

  it('should pass --debug to node', function () {
    const settings = parse(asCLI('--debug test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');

    assert(commandToString(command(settings)).indexOf('--debug') !== -1);
  });

  it('should pass --harmony to node', function () {
    const settings = parse(asCLI('--harmony test/fixtures/app.js'));

    assert(settings.script === 'test/fixtures/app.js');
    assert(settings.execOptions.exec === 'node');
    assert(commandToString(command(settings)).indexOf('--harmony') !== -1);
  });
});

describe('nodemon argument parser', function () {
  it('support strings', function () {
    const settings = cli.parse('node nodemon -v');
    assert(settings.version === true, 'version flag');
  });

  it('should support short versions of flags', function () {
    const settings = cli.parse('node nodemon -v -x java -I -V -q -w fixtures -i fixtures -d 5 -L -C -e pug -s SIGHUP');
    assert(settings.version, 'version');
    assert(settings.verbose, 'verbose');
    assert(settings.exec === 'java', 'exec');
    assert(settings.quiet, 'quiet');
    assert(settings.stdin === false, 'read stdin');
    assert(settings.watch[0] === 'fixtures', 'watch');
    assert(settings.ignore[0] === 'fixtures', 'ignore');
    assert(settings.delay === 5000, 'delay 5 seconds');
    assert(settings.runOnChangeOnly, 'run on change only');
    assert(settings.ext === 'pug', 'extension is pug');
    assert(settings.signal === 'SIGHUP', 'signal is SIGHUP');
  });


  it('should support long versions of flags', function () {
    const settings = cli.parse('node nodemon --version --exec java --verbose --quiet --watch fixtures --ignore fixtures --no-stdin --delay 5 --legacy-watch --exitcrash --on-change-only --ext pug --config my/.nodemon.json --signal SIGHUP');
    assert(settings.version, 'version');
    assert(settings.verbose, 'verbose');
    assert(settings.exec === 'java', 'exec');
    assert(settings.quiet, 'quiet');
    assert(settings.stdin === false, 'read stdin');
    assert(settings.exitcrash, 'exit if crash');
    assert(settings.watch[0] === 'fixtures', 'watch');
    assert(settings.ignore[0] === 'fixtures', 'ignore');
    assert(settings.delay === 5000, 'delay 5 seconds');
    assert(settings.runOnChangeOnly, 'run on change only');
    assert(settings.ext === 'pug', 'extension is pug');
    assert(settings.configFile === 'my/.nodemon.json', 'custom config file name is my/.nodemon.json');
    assert(settings.signal === 'SIGHUP', 'signal is SIGHUP');
  });
});

describe('nodemon respects custom "ext" and "execMap"', function () {
  it('should support "ext" and "execMap" for same extension', function () {
    const settings = parse(asCLI('-x "node --harmony" -e "js json coffee" test/fixtures/app.coffee'));
    assert(settings.execOptions.ext.indexOf('js') === 0, 'js is monitored: ' + settings.execOptions.ext);
    assert(settings.execOptions.ext.split(',').length === 3, 'all extensions monitored');
    assert(settings.execOptions.exec.indexOf('node') === 0, 'node is exec: ' + settings.execOptions.exec);
  });
});

describe('nodemon should support implicit extensions', () => {
  it('should expand script to script.js', () => {
    const cwd = process.cwd();
    process.chdir('test/fixtures/');
    const settings = parse(asCLI('env'));
    process.chdir(cwd);
    const cmd = commandToString(command(settings));
    assert.equal(cmd, 'node env.js', 'implicit extension added');
  });

  it('should support non-js', () => {
    const cwd = process.cwd();
    process.chdir('test/fixtures/');
    const settings = parse(asCLI('hello --ext py'));
    process.chdir(cwd);
    const cmd = commandToString(command(settings));
    assert.equal(cmd, 'node hello.py', 'implicit extension added');
  });

});

describe('nodemon should slurp properly', () => {
  it('should read quotes as a single entity', () => {
    const settings = parse(asCLI('notindex.js -- -b "hello - world"'));
    assert(settings.execOptions.exec === 'node', 'node is exec');
    assert(settings.args.length === 3, 'only has 3 arguments to node');
  });

  it('should pass non-slurped args to script', () => {
    const settings = parse(asCLI('-- --log'));
    const cmd = commandToString(command(settings));
    assert.equal(cmd, 'node ./lib/nodemon.js --log', 'args passed to script');
  });

  it('should pass non-slurped args to explicit script', () => {
    const settings = parse(asCLI('./lib/nodemon.js -- --log'));
    const cmd = commandToString(command(settings));
    assert.equal(cmd, 'node ./lib/nodemon.js --log', 'args passed to script');
  });

  it('should pass slurped args to explicit script', () => {
    const settings = parse(asCLI('./lib/nodemon.js --log'));
    const cmd = commandToString(command(settings));
    assert.equal(cmd, 'node ./lib/nodemon.js --log', 'args passed to script');
  });

  it('should handle a mix of slurps', () => {
    let cmd;
    let settings;

    cmd = commandToString(command(parse(asCLI('--inspect -- --log'))));
    assert.equal(cmd, 'node --inspect ./lib/nodemon.js --log', 'args passed to script');

    cmd = commandToString(command(parse(asCLI('--inspect ./lib/nodemon.js -- --log'))));
    assert.equal(cmd, 'node --inspect ./lib/nodemon.js --log', 'args passed to script');

    cmd = commandToString(command(parse(asCLI('--inspect --log ./lib/nodemon.js'))));
    assert.equal(cmd, 'node --inspect --log ./lib/nodemon.js', 'args passed to script');
  });

});

describe('nodemon with CoffeeScript', function () {
  it('should not add --nodejs by default', function () {
    const settings = parse(asCLI('test/fixtures/app.coffee'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') === -1, 'is not using --nodejs');
  });

  it('should not add --nodejs with app arguments', function () {
    const settings = parse(asCLI('test/fixtures/app.coffee --my-app-arg'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs.indexOf('--nodejs') === -1, 'is not using --nodejs');
  });

  it('groups exec argument into a single --nodejs argument', function () {
    const settings = parse(asCLI('--harmony --debug test/fixtures/app.coffee'));
    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(settings.execOptions.execArgs[0] === '--nodejs', 'is using --nodejs');
    assert(settings.execOptions.execArgs[1] === '--harmony --debug', 'is grouping exec arguments');
  });

  it('should add --nodejs when used with --debug', function () {
    const settings = parse(asCLI('--debug test/fixtures/app.coffee'));
    const cmd = commandToString(command(settings));

    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(cmd.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(cmd.indexOf('--debug') !== -1, '--debug being used');
  });

  it('should add --nodejs when used with --debug-brk', function () {
    const settings = parse(asCLI('--debug-brk test/fixtures/app.coffee'));
    const cmd = commandToString(command(settings));

    assert(settings.execOptions.exec.indexOf('coffee') === 0, 'executable is CoffeeScript');
    assert(cmd.indexOf('--nodejs') !== -1, '--nodejs being used');
    assert(cmd.indexOf('--debug-brk') !== -1, '--debug-brk being used');
  });
});

describe('nodemon --delay argument', function () {
  it('should support an integer value', function () {
    const settings = cli.parse('node nodemon --delay 5');
    assert(settings.delay === 5000, 'delay 5 seconds');
  });

  it('should support a float value', function () {
    const settings = cli.parse('node nodemon --delay 1.2');
    assert(settings.delay === 1200, 'delay 1.2 seconds');
  });

  it('should support a value with a time specifier for seconds (s)', function () {
    const settings = cli.parse('node nodemon --delay 5s');
    assert(settings.delay === 5000, 'delay 5 seconds');
  });

  it('should support a value with a time specifier for milliseconds (ms)', function () {
    const settings = cli.parse('node nodemon --delay 1200ms');
    assert(settings.delay === 1200, 'delay 1.2 seconds');
  });
});
