'use strict';
/*global describe:true, it: true */
var exec = require('../../lib/config/exec'),
    command = require('../../lib/config/command'),
    assert = require('assert');

describe('nodemon exec', function () {
  it('should default to node', function () {
    var options = exec({ script: 'index.js' });
    assert(options.exec === 'node', 'exec is node');
    assert(options.ext === 'js');
  });

  it('should support --debug', function () {
    var options = exec({ script: 'app.js', nodeArgs: [ '--debug' ]});

    assert(options.exec === 'node', 'exec is node');
    assert(options.execArgs.indexOf('--debug') !== -1, '--debug is in the execArgs');
    assert(options.ext.indexOf('js') !== -1, 'extension watched is .js');
  });

  it('should support --debug=XXXX', function () {
    var options = exec({ script: 'app.js', nodeArgs: [ '--debug=9999' ]});

    assert(options.exec === 'node');
    assert(options.execArgs.indexOf('--debug=9999') !== -1);
    assert(options.ext.indexOf('js') !== -1);
  });

  it('should support multiple extensions', function () {
    var options = exec({ script: 'app.js', ext: 'js, jade, hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('jade') !== -1, 'comma separated string');

    options = exec({ script: 'app.js', ext: 'js|jade|hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('jade') !== -1, 'pipe separated string');
  });

  it('should replace {{filename}}', function () {
    var options = exec({ script: 'app.js', exec: 'node {{filename}}.tmp --somethingElse' });
    var cmd = command({ execOptions: options });

    assert(cmd.executable + ' ' + cmd.args.join(' ') === 'node app.js.tmp --somethingElse', 'filename is interpolated');
  });

  it('should support extension maps', function () {
    var options = exec({ script: 'template.jade' }, { 'jade': 'jade {{filename}} --out /tmp' });
    assert(options.exec === 'jade', 'correct exec is used');
    assert(options.execArgs[0] === 'template.jade', 'filename interpolated');
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
    assert(options.execArgs.indexOf('--debug') !== -1);
    assert(options.ext.indexOf('coffee') !== -1);
  });

  it('should support custom execs', function () {
    var options = exec({ script: 'app.py', exec: 'python'});

    assert(options.exec === 'python');
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should support custom executables with arguments', function () {
    var options = exec({ script: 'app.py', exec: 'python --debug'});

    assert(options.exec === 'python');
    assert(options.execArgs.indexOf('--debug') !== -1);
    assert(options.ext.indexOf('py') !== -1);
  });

  it('should treat exec as a single path when execShell is disabled', function() {
    var options = exec({script: 'app.js', exec: '/path to node', execShell: false});

    assert(options.exec === '/path to node', options.exec);
  });

});
