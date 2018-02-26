/*global describe:true, it: true, after: true, beforeEach */
const assert = require('assert');
const merge = require('../../lib/utils/merge');
const proxyquire = require('proxyquire').noPreserveCache();

describe('spawn args', () => {
  it('handles windows urls correctly', () => {
    const getSpawnArgs = proxyquire('../../lib/monitor/spawn-args', {
      merge,
      isWindows: true,
    });

    const res = getSpawnArgs({
      options: {
        execOptions: { env: [] },
      },
      config: {
        options: {},
        command: {
          raw: 'touch'
        }
      },
    });

    console.log(res);

    assert('ok');


  });
});
