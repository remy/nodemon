'use strict';
/*global describe, it, afterEach, beforeEach, after */
const load = require('../../lib/config/load');
const utils = require('../../lib/utils')
const path = require('path');
const testUtils = require('../utils');
const assert = require('assert');
const noop = {};

describe('config logging', () => {
  const pwd = process.cwd();
  const oldHome = utils.home;

  beforeEach(() => {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
    utils.home = path.resolve(pwd, ['test', 'fixtures', 'global'].join(path.sep));
  });

  afterEach(() => {
    process.chdir(pwd);
    utils.home = oldHome;
  });

  it('should show package is being used', done => {
    process.chdir(path.resolve(pwd, 'test/fixtures/packages/package-json-settings'));
    const config = {};

    load(noop, noop, config, () => {
      assert.equal(config.loaded.length, 2, 'global nodemon and local package');
      done();
    });
  });

  it('should not read package if no nodemonConfig', done => {
    utils.home = process.cwd();
    process.chdir(path.resolve(pwd, 'test/fixtures'));
    const config = {};

    load(noop, noop, config, () => {
      const files = config.loaded.map(_ => path.relative(pwd, _));
      assert.equal(files.length, 1, 'global nodemon');
      assert.deepEqual(files, ['test/fixtures/nodemon.json'], 'global nodemon');
      done();
    });
  });

  it('should ignore legacy if new format is found', done => {
    utils.home = process.cwd();
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    const config = {};

    load(noop, noop, config, () => {
      const loaded = config.loaded.map(_ => path.relative(pwd, _));
      assert.equal(loaded.length, 1, 'global nodemon is loaded and legacy is ignored');
      done();
    });
  });

  it('should load legacy if no nodemon.json found', done => {
    utils.home = path.resolve(pwd, 'test/fixtures/configs'); // no valid nodemon.json files
    process.chdir(path.resolve(pwd, 'test/fixtures/legacy'));
    const config = {};

    load(noop, noop, config, () => {
      const loaded = config.loaded.map(_ => path.relative(pwd, _));
      assert.equal(loaded.length, 1, 'legacy loaded');
      done();
    });
  });

  it('should load nothing if nothing found', done => {
    utils.home = path.resolve(pwd, 'test/fixtures/configs'); // no valid nodemon.json files
    process.chdir(pwd);
    const config = {};

    load(noop, noop, config, () => {
      const loaded = config.loaded.map(_ => path.relative(pwd, _));
      assert.deepEqual(loaded, [], 'nothing loaded');
      done();
    });
  });
});
