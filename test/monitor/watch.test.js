'use-strict';

var assert = require('assert');
var chokidar = require('chokidar');
var process = require('process');
var config = require('../../lib/config');
var watch = require('../../lib/monitor/watch');

describe('watch', function() {
  it('should pass watchOptions to the watcher', function(done) {
    process.chdir(process.cwd() + '/test/fixtures/configs');

    var passedOptions = {};
    var originalWatch = chokidar.watch;
    chokidar.watch = function(dirs, options) {
      passedOptions = options;
      return originalWatch(dirs, options);
    };

    config.load({
      configFile: process.cwd() + '/watch-options.json'
    }, () => {
      watch.watch();
      chokidar.watch = originalWatch;
      assert(passedOptions.awaitWriteFinish, 'awaitWriteFinish does not have the correct value');
      done();
    });
  });
})
