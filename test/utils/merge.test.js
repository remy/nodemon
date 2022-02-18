/*global describe:true, it: true */
const merge = require('../../lib/utils/merge'),
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
  let original = {};

  beforeEach(function () {
    original = getOriginal();
  });

  it('should be the same with empty targets', function () {
    const result = merge(original, {});
    assert.deepEqual(original, result);
  });

  it('should merge missing properties', function () {
    const simple = {
      ignore: []
    };

    const result = merge(simple, {
      watch: []
    });

    assert.deepEqual({
      ignore: [],
      watch: []
    }, result);
  });

  it('should merge complex missing properties', function () {
    const target = [{
          one: 1,
          two: 2
        }, {
          three: 3,
          four: 4
        }];

    const result = merge(original, {
      watch: target
    });

    original.watch = target;

    assert.deepEqual(original, result);
  });

  it('should merge deep complex missing properties', function () {
    const target = {
      execOptions: { verbose: true,
         script: './lib/app',
         args: [],
         exec: 'node',
         execArgs: [],
         ext: ''
       }
    };

    const result = merge(original, target);

    original.execOptions = target.execOptions;

    assert.deepEqual(original, result);
  });

  it('should ignore existing properties', function () {
    let original = {
      execOptions: {
        ext: 'js'
      }
    };

    let target = {
      execOptions: {
        ext: 'notjs'
      }
    };

    let result = merge(original, target);
    assert.deepEqual(original, result);

    original = { ext: 'js' };
    target = { ext: 'notjs' };

    result = merge(original, target);
    assert.deepEqual(original, result);
  });

  it('should merge in to "empty" properties', function () {
    const target = {
      execOptions: {
        ext: 'js'
      }
    };

    const original = {
      execOptions: {
        ext: ''
      }
    };

    const result = merge(original, target);

    original.execOptions = target.execOptions;
    assert.deepEqual(original, result);
  });

  it('should merge into empty objects', function () {
    const original = {
      foo: 'bar',
      execOptions: {}
    };

    const target = {
      execOptions: {
        ext: 'js'
      }
    };

    const result = merge(original, target);
    assert.deepEqual({ foo: 'bar', execOptions: { ext: 'js' } }, result);
  });

  it('should merge into empty arrays', function () {
    const original = {
      foo: 'bar',
      execOptions: []
    };

    const target = {
      execOptions: ['js']
    };

    const result = merge(original, target);

    assert.deepEqual({ foo: 'bar', execOptions: ['js'] }, result)
  });

  it('should merge into deep empty arrays', function () {
    // return;
    const original = {
      foo: {
        name: []
      }
    };

    const target = {
      foo: {
        name: ['remy']
      }
    };

    const result = merge(original, target);

    assert.deepEqual({ foo: { name: ['remy'] } }, result)
  });

});