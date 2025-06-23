'use strict';
/*global describe:true, it: true */
import path from 'path';
import exec, { expandScript } from '../../lib/config/exec.js';
import command from '../../lib/config/command.js';
import assert from 'assert';
import utils from '../../lib/utils/index.js';

function toCmd(options) {
  const cmd = command({
    script: options.script || 'app.js',
    execOptions: options,
  });

  return {
    cmd: cmd,
    string: utils.stringify(cmd.executable, cmd.args),
  };
}

describe('expandScript', () => {
  const pwd = process.cwd();

  afterEach(function () {
    process.chdir(pwd);
  });

  beforeEach(function () {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
  });

  it('should expand app.js', () => {
    const script = expandScript('app');
    assert.equal(script, 'app.js', script);
  });

  it('should expand hello.py', () => {
    const script = expandScript('hello', '.py');
    assert.equal(script, 'hello.py', script);
  });

  it('should ignore foo.js', () => {
    const script = expandScript('foo', '.js');
    assert.equal(script, 'foo', script);
  });
});

describe('nodemon exec', function () {
  var pwd = process.cwd();

  afterEach(function () {
    process.chdir(pwd);
  });

  beforeEach(function () {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
  });

  it('should default to node', function () {
    const options = exec({ script: 'index.js' });
    const cmd = toCmd(options);
    assert.equal(options.exec, 'node', 'exec is node');
    assert.equal(options.ext, 'js,mjs,cjs,json');
    assert.equal(cmd.string, 'node index.js', cmd.string);
  });

  it('should support --debug', function () {
    var options = exec({ script: 'app.js', nodeArgs: ['--debug'] });
    var cmd = toCmd(options);
    assert(cmd.string === 'node --debug app.js', cmd.string);
    assert(options.ext.indexOf('js') !== -1, 'extension watched is .js');
  });

  it('should support --debug=XXXX', function () {
    var options = exec({ script: 'app.js', nodeArgs: ['--debug=9999'] });
    var cmd = toCmd(options);
    assert(cmd.string === 'node --debug=9999 app.js', cmd.string);
    assert(options.exec === 'node');
    assert(options.ext.indexOf('js') !== -1);
  });

  it('should support multiple extensions', function () {
    var options = exec({ script: 'app.js', ext: 'js, pug, hbs' });
    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js', cmd.string);
    assert(options.ext.indexOf('pug') !== -1, 'comma separated string');

    options = exec({ script: 'app.js', ext: 'js|pug|hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('pug') !== -1, 'pipe separated string');
  });

  it('should support watching all extensions', function () {
    var options = exec({ script: 'app.js', ext: '' });
    assert.equal(
      options.ext,
      '',
      'does not set default extensions when empty extension requested'
    );

    options = exec({ script: 'app.js', ext: '.' });
    assert.equal(options.ext, '', 'treats `.` as wildcard extension');

    options = exec({ script: 'app.js', ext: '*' });
    assert.equal(options.ext, '', 'treats `*` as wildcard extension');

    options = exec({ script: 'app.coffee', exec: 'coffee', ext: '' });
    assert.equal(
      options.ext,
      '',
      'does not set default extensions when empty extension requested'
    );
  });

  it('should replace {{filename}}', function () {
    var options = exec({
      script: 'app.js',
      exec: 'node {{filename}}.tmp --somethingElse',
    });

    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js.tmp --somethingElse', cmd.string);
  });

  it('should not split on spaces in {{filename}}', function () {
    var options = exec({
      script: 'my app.js',
      exec: 'node {{filename}}.tmp --somethingElse',
    });
    var cmd = toCmd(options);
    // var cmd = command({ execOptions: options });

    assert(cmd.string === 'node my app.js.tmp --somethingElse', cmd.string);
  });

  it('should support extension maps', function () {
    var options = exec(
      { script: 'template.pug' },
      { pug: 'pug {{filename}} --out /tmp' }
    );
    var cmd = toCmd(options);
    assert(cmd.string === 'pug template.pug --out /tmp', cmd.string);
  });

  it('should support input from argv#parse', async function () {
    const parse = (await import('../../lib/cli/parse.js')).default;
    parse(
      'node /usr/local/bin/nodemon.js --debug -e js,pug,hbs app.js'.split(' ')
    );
  });

  it('should use coffeescript on .coffee', function () {
    var options = exec({ script: 'index.coffee' });
    assert(
      options.exec.indexOf('coffee') === 0,
      'using coffeescript to execute'
    );
    assert(options.ext.indexOf('coffee') !== -1);
  });

  it('should support coffeescript in debug mode', function () {
    var options = exec({ script: 'app.coffee', nodeArgs: ['--debug'] });

    assert(
      options.exec.indexOf('coffee') === 0,
      'using coffeescript to execute'
    );
    assert(options.execArgs[1].indexOf('--debug') !== -1);
    assert(options.ext.indexOf('coffee') !== -1);
  });

  it('should support custom execs', function () {
    var options = exec({ script: 'app.py', exec: 'python' });

    assert(options.exec === 'python');
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should support custom executables with arguments', function () {
    var options = exec({ script: 'app.py', exec: 'python --debug' });
    var cmd = toCmd(options);

    assert(cmd.string === 'python --debug app.py', cmd.string);
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should support an array of exec arguments', function () {
    var options = exec({ script: 'app.js', exec: ['/path to node', '-v'] });

    assert(options.exec === '/path to node', options.exec);
    assert(options.execArgs.length === 1, options.execArgs.length);
    assert(options.execArgs[0] === '-v', options.execArgs[0]);
  });

  it('should support non-english filenames', async function () {
    const parse = (await import('../../lib/cli/parse.js')).default;
    var options = parse('node nodemon.js -e ζ ./server.js "$@"'.split(' '));
    var res = exec(options);
    assert(res.ext === 'ζ', 'exec did not bail');
  });

  it('should support multi-level file extensions', function () {
    var options = exec({ ext: '.ts.d,js md' });

    assert(options.ext.indexOf('ts.d') !== -1);
    assert(options.ext.indexOf('js') !== -1);
    assert(options.ext.indexOf('md') !== -1);
  });

  it('should support single-level file extensions', function () {
    var options = exec({ ext: '.js, pug' });

    assert(options.ext.indexOf('js') !== -1);
    assert(options.ext.indexOf('pug') !== -1);
  });

  it('should expand app to app.js', function () {
    var options = exec({ script: 'app' });
    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js', cmd.string);

    options = exec({ script: 'app', ext: '' });
    cmd = toCmd(options);
    assert(cmd.string === 'node app.js', cmd.string);
  });

  it('should expand based on custom extensions to hello.py', function () {
    var options = exec({ script: 'hello', ext: '.py', exec: 'python' });
    var cmd = toCmd(options);
    assert(cmd.string === 'python hello.py', cmd.string);
  });

  it('should expand based on custom extensions to app.js (js,jsx,mjs)', function () {
    var options = exec({ script: 'app', ext: 'js,jsx,mjs' });
    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js', cmd.string);
  });

  it('should not expand index to non-existant index.js', function () {
    var options = exec({ script: 'index' });
    var cmd = toCmd(options);
    assert(cmd.string === 'node index', cmd.string);
  });
});
