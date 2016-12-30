'use strict';
/* global describe, it, beforeEach, before, after */
var nodemon = require('../../lib/');
var debug = require('debug')('nodemon');
var assert = require('assert');
var path = require('path');
var touch = require('touch');
var utils = require('../utils');
var dir = path.resolve(__dirname, '..', 'fixtures', 'events');
var appjs = path.resolve(dir, 'env.js');
var asCLI = utils.asCLI;
var fork = require('child_process').fork;

describe('events should follow normal flow on user triggered change',
  function () {
  function conf() {
    utils.port++;
    return {
      script: appjs,
      verbose: true,
      stdout: false,
      noReset: true,
      ext: 'js',
      env: {
        PORT: utils.port,
        USER: 'nodemon',
      },
    };
  }

	function childStartedCustomConf()
	{
		var cConf = conf();
		cConf['script'] = path.resolve(__dirname, 'childStartedApp.js');
		cConf['childStarted'] = 'customChildStarted';
		return cConf;
	}

  var cwd = process.cwd();

  beforeEach(function (done) {
    debug('beforeEach');
    nodemon.once('exit', function () {
      nodemon.reset(done);
    }).emit('quit');
  });

  before(function () {
    process.chdir(dir);
  });

  after(function (done) {
    debug('after');
    process.chdir(cwd);
    nodemon.once('exit', function () {
      nodemon.reset(function () {
        setTimeout(done, 1000);
      });
    }).emit('quit');
  });

  it('start', function (done) {
    debug('start');
    nodemon(conf()).once('start', function () {
      assert(true, '"start" event');
      done();
    });
  });

  it('config:update', function (done) {
    nodemon(conf()).on('config:update', function () {
      assert(true, '"config:update" event');
      done();
    });
  });

  it('exit', function (done) {
    var plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });
    var run = 0;

    nodemon(conf()).on('exit', function () {
      plan.assert(true, '"exit" event');
      if (run === 1) {
        setTimeout(function () {
          plan.assert(true, 'restarting ' + appjs);
          touch.sync(appjs);
        }, 1500);
      } else if (run === 2) {
        plan.assert(true, 'finished');
      } else {
        plan.assert(false, 'quit too many times: ' + run);
      }
    }).on('start', function () {
      run++;
    });
  });

  it('quit', function (done) {
    var cmd = asCLI('env.js');
    cmd.exec = path.join('..', '..', '..', cmd.exec);
    var p = fork(cmd.exec, cmd.args, {
      cwd: dir,
      silent: true,
      detached: true,
    });
    p.stdout.on('data', function (m) {
      m = m.toString().trim();
      if (m === 'STOPPED') {
        p.kill('SIGINT');
      }
      console.log("m");
      if (m === 'QUIT') {
        assert(true, '"quit" event');
        done();
      }
    });
  });


  it('stdout', function (done) {
    nodemon(conf()).once('stdout', function (data) {
      assert(true, '"stdout" event with: ' + data);
      done();
    });
  });

	it('start:child', function (done) {
    nodemon(conf()).once('start:child', function (data) {
      assert(true, '"start:child" event with: ' + data);
      done();
    });
  });

	it('start:child with custom event-trigger', function (done) {
    nodemon(childStartedCustomConf()).once('start:child', function (data) {
      assert(true, '"start:child" event with: ' + data);
      done();
    });
  });

  it('restart', function (done) {
    var plan = new utils.Plan(4, function () {
      nodemon.reset(done);
    });

    nodemon(conf()).on('restart', function (files) {
      plan.assert(true, '"restart" event with ' + files);
      plan.assert(files[0] === appjs, 'restart due to ' + files.join(' ') +
        ' changing');
    }).once('exit', function () {
      plan.assert(true, '"exit" event');
      setTimeout(function () {
        plan.assert(true, 'restarting');
        touch.sync(appjs);
      }, 1500);
    });
  });
});
