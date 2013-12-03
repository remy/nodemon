/*global describe:true, it: true */
var exec = require('../../lib/config/exec'),
    assert = require('assert');

describe('nodemon exec', function () {
  it('should default to node', function () {
    var options = exec({ script: 'index.js' });
    assert(options.exec === 'node');
    assert(options.ext === '.js$');
  });

  it('should support --debug', function () {
    var options = exec({ script: 'app.js', nodeArgs: [ '--debug' ]});

    assert(options.exec === 'node');
    assert(options.execArgs.indexOf('--debug') !== -1);
    assert(options.ext.indexOf('.js') !== -1);
  });

  it('should support multiple extensions', function () {
    var options = exec({ script: 'app.js', ext: 'js, jade, hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('jade') !== -1, 'comma separated string');

    // options = exec({ script: 'app.js', ext: 'js,jade,hbs'.split(',') });
    // assert(options.exec === 'node');
    // assert(options.ext.indexOf('jade') !== -1, 'as an array');

    options = exec({ script: 'app.js', ext: 'js|jade|hbs' });
    assert(options.exec === 'node');
    assert(options.ext.indexOf('jade') !== -1, 'pipe separated string');
  });

  it('should support input from argv#parse', function () {
    var parse = require('../../lib/cli/parse');

    // console.log(process.argv);

    var parsed = parse('node /usr/local/bin/nodemon.js --debug -e js,jade,hbs app.js'.split(' '));
    // console.log(parsed);
  });

  it('should use coffeescript on .coffee', function () {
    var options = exec({ script: 'index.coffee' });
    assert(options.exec === 'coffee');
    assert(options.ext.indexOf('.coffee') !== -1);
  });

  it('should support coffeescript in debug mode', function () {
    var options = exec({ script: 'app.coffee', nodeArgs: [ '--debug' ] });

    assert(options.exec === 'coffee');
    assert(options.execArgs.indexOf('--debug') !== -1);
    assert(options.ext.indexOf('.coffee') !== -1);
  });

  it('should support custom execs', function () {
    var options = exec({ script: 'app.py', exec: 'python'});

    assert(options.exec === 'python');
    assert(options.ext.indexOf('.py') !== -1);
  });

  it('should support custom executables with arguments', function () {
    var options = exec({ script: 'app.py', exec: 'python --debug'});

    assert(options.exec === 'python');
    assert(options.execArgs.indexOf('--debug') !== -1);
    assert(options.ext.indexOf('.py') !== -1);
  });

});