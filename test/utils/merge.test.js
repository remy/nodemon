/*global describe:true, it: true */
var merge = require('../../lib/utils/merge'),
    assert = require('assert');

function getOriginal() {
  return {
    verbose: true,
    script: './lib/app',
    args: [],
    execOptions:
     { verbose: true,
       script: './lib/app',
       args: [],
       exec: 'node',
       execArgs: [],
       ext: ''
     },
    restartable: 'rs'
  };
}

describe('utils merge', function () {
  var original = {};

  beforeEach(function () {
    original = getOriginal();
  });

  it('should be the same with empty targets', function () {
    var result = merge(original, {});
    assert.deepEqual(original, result);
  });

  it('should merge missing properties', function () {
    var simple = {
      ignore: []
    };

    var result = merge(simple, {
      watch: []
    });

    assert.deepEqual({
      ignore: [],
      watch: []
    }, result);
  });

  it('should merge complex missing properties', function () {
    var target = [{
          one: 1,
          two: 2
        }, {
          three: 3,
          four: 4
        }];

    var result = merge(original, {
      watch: target
    });

    original.watch = target;

    assert.deepEqual(original, result);
  });

  it('should merge deep complex missing properties', function () {
    var target = {
      execOptions: { verbose: true,
         script: './lib/app',
         args: [],
         exec: 'node',
         execArgs: [],
         ext: ''
       }
    };

    var result = merge(original, target);

    original.execOptions = target.execOptions;

    assert.deepEqual(original, result);
  });

  it('should ignore existing properties', function () {
    var original = {
      execOptions: {
        ext: 'js'
      }
    };

    var target = {
      execOptions: {
        ext: 'notjs'
      }
    };

    var result = merge(original, target);
    assert.deepEqual(original, result);

    original = { ext: 'js' };
    target = { ext: 'notjs' };

    result = merge(original, target);
    assert.deepEqual(original, result);
  });

  it('should merge in to "empty" properties', function () {
    var target = {
      execOptions: {
        ext: 'js'
      }
    };

    var original = {
      execOptions: {
        ext: ''
      }
    };

    var result = merge(original, target);

    original.execOptions = target.execOptions;
    assert.deepEqual(original, result);
  });

  it('should merge into empty objects', function () {
    var original = {
      foo: 'bar',
      execOptions: {}
    };

    var target = {
      execOptions: {
        ext: 'js'
      }
    };

    var result = merge(original, target);
    assert.deepEqual({ foo: 'bar', execOptions: { ext: 'js' } }, result);
  });

  it('should merge into empty arrays', function () {
    var original = {
      foo: 'bar',
      execOptions: []
    };

    var target = {
      execOptions: ['js']
    };

    var result = merge(original, target);

    assert.deepEqual({ foo: 'bar', execOptions: ['js'] }, result)
  });

  it('should merge into deep empty arrays', function () {
    // return;
    var original = {
      foo: {
        name: []
      }
    };

    var target = {
      foo: {
        name: ['remy']
      }
    };

    var result = merge(original, target);

    assert.deepEqual({ foo: { name: ['remy'] } }, result)
  });

});