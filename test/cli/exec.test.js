'use strict';
/*global describe:true, it: true */
var exec = require('../../lib/config/exec'),
    command = require('../../lib/config/command'),
    assert = require('assert'),
    utils = require('../../lib/utils');

function toCmd(options) {
  var cmd = command({
    script: options.script || 'app.js',
    execOptions: options
  });

  return {
    cmd: cmd,
    string: utils.stringify(cmd.executable, cmd.args)
  };
}

describe('nodemon exec', function () {
  it('should default to node', function () {
    var options = exec({ script: 'index.js' });
    var cmd = toCmd(options);
    assert.equal(options.exec, 'node', 'exec is node');
    assert.equal(options.ext, 'js,json');
    assert.equal(cmd.string, 'node index.js', cmd.string);
  });

  it('should support --debug', function () {
    var options = exec({ script: 'app.js', nodeArgs: [ '--debug' ]});
    var cmd = toCmd(options);
    assert(cmd.string === 'node --debug app.js', cmd.string);
    assert(options.ext.indexOf('js') !== -1, 'extension watched is .js');
  });

  it('should support --debug=XXXX', function () {
    var options = exec({ script: 'app.js', nodeArgs: [ '--debug=9999' ]});
    var cmd = toCmd(options);
    assert(cmd.string === 'node --debug=9999 app.js', cmd.string);
    assert(options.exec === 'node');
    assert(options.ext.indexOf('js') !== -1);
  });

  it('should support multiple extensions', function () {
    var options = exec({ script: 'app.js', ext: 'js, jade, hbs' });
    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js', cmd.string);
    assert(options.ext.indexOf('jade') !== -1, 'comma separated string');

    options = exec({ script: 'app.js', ext: 'js|jade|hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('jade') !== -1, 'pipe separated string');
  });

  it('should replace {{filename}}', function () {
    var options = exec({ script: 'app.js', exec: 'node {{filename}}.tmp --somethingElse' });

    var cmd = toCmd(options);
    assert(cmd.string === 'node app.js.tmp --somethingElse', cmd.string);
  });

  it('should not split on spaces in {{filename}}', function () {
    var options = exec({ script: 'my app.js', exec: 'node {{filename}}.tmp --somethingElse' });
    var cmd = toCmd(options);
    // var cmd = command({ execOptions: options });

    assert(cmd.string === 'node my app.js.tmp --somethingElse', cmd.string);
  });

  it('should support extension maps', function () {
    var options = exec({ script: 'template.jade' }, { 'jade': 'jade {{filename}} --out /tmp' });
    var cmd = toCmd(options);
    assert(cmd.string === 'jade template.jade --out /tmp', cmd.string);
  });

  it('should support input from argv#parse', function () {
    var parse = require('../../lib/cli/parse');
    parse('node /usr/local/bin/nodemon.js --debug -e js,jade,hbs app.js'.split(' '));
  });

  it('should use coffeescript on .coffee', function () {
    var options = exec({ script: 'index.coffee' });
    assert(options.exec.indexOf('coffee') === 0, 'using coffeescript to execute');
    assert(options.ext.indexOf('coffee') !== -1);
  });

  it('should support coffeescript in debug mode', function () {
    var options = exec({ script: 'app.coffee', nodeArgs: [ '--debug' ] });

    assert(options.exec.indexOf('coffee') === 0, 'using coffeescript to execute');
    assert(options.execArgs[1].indexOf('--debug') !== -1);
    assert(options.ext.indexOf('coffee') !== -1);
  });

  it('should support custom execs', function () {
    var options = exec({ script: 'app.py', exec: 'python'});

    assert(options.exec === 'python');
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should support custom executables with arguments', function () {
    var options = exec({ script: 'app.py', exec: 'python --debug'});
    var cmd = toCmd(options);

    assert(cmd.string === 'python --debug app.py', cmd.string);
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should support an array of exec arguments', function() {
    var options = exec({script: 'app.js', exec: ['/path to node', '-v']});

    assert(options.exec === '/path to node', options.exec);
    assert(options.execArgs.length === 1, options.execArgs.length);
    assert(options.execArgs[0] === '-v', options.execArgs[0]);
  });

  it('should support non-english filenames', function () {
    var parse = require('../../lib/cli/parse');
    var options = parse('node nodemon.js -e ζ ./server.js "$@"'.split(' '));
    var res = exec(options);
    assert(res.ext === 'ζ', 'exec did not bail');
  });
});
