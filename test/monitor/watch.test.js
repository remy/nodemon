'use-strict';

const assert = require('assert');
const chokidar = require('chokidar');
const process = require('process');
const config = require('../../lib/config');
const watch = require('../../lib/monitor/watch');

describe('watch', function() {
  it('should pass watchOptions to the watcher', function(done) {
    process.chdir(process.cwd() + '/test/fixtures/configs');

    let passedOptions = {};
    const originalWatch = chokidar.watch;
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
