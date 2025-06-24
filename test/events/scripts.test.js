'use strict';
/*global describe:true, it: true, afterEach: true, beforeEach: true, after:true */
import cli from '../../lib/cli/index.js';
import path from 'path';,
  testUtils = require('../utils'),
  utils = require('../../lib/utils'),
  exec = require('../../lib/config/exec'),
  nodemon = require('../../lib/nodemon'),
  command = require('../../lib/config/command'),
  appjs = path.resolve(__dirname, '..', 'fixtures', 'env.js'),
  assert = require('assert');

function asCLI(cmd) {
  return ('node nodemon ' + (cmd || '')).trim();
}

function parse(cmd) {
  var parsed = cli.parse(cmd);
  parsed.execOptions = exec(parsed);
  return parsed;
}

function commandToString(command) {
  return utils.stringify(command.executable, command.args);
}

describe('nodemon API events', function () {
  var pwd = process.cwd(),
    oldhome = utils.home;

  afterEach(function () {
    process.chdir(pwd);
    utils.home = oldhome;
  });

  after(function (done) {
    // clean up just in case.
    setTimeout(done, 1000);
  });

  beforeEach(function (done) {
    // move to the fixtures directory to allow for config loading
    process.chdir(path.resolve(pwd, 'test/fixtures'));
    utils.home = path.resolve(
      pwd,
      ['test', 'fixtures', 'events'].join(path.sep)
    );

    nodemon.reset(done);
  });

  it('should trigger start event script', function (done) {
    var plan = new testUtils.Plan(4, done);
    nodemon({
      script: appjs,
      verbose: true,
      stdout: false,
      env: { NODEMON_ENV: 'nodemon' },
    })
      .on('start', function () {
        plan.assert(true, 'started');
      })
      .on('exit', function () {
        plan.assert(true, 'exit');
      })
      .on('stdout', function (data) {
        data = data.toString().trim();
        if (data === 'OK') {
          plan.assert(true, 'OK found');
        } else if (data === 'STOPPED') {
          plan.assert(true, 'STOPPED found');
        } else if (data === 'nodemon') {
          // expected output
        } else {
          plan.assert(false, data + ' found');
        }
      });
  });
});
