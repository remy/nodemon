'use-strict';

import assert from 'assert';
import chokidar from 'chokidar';
import process from 'process';
import config from '../../lib/config.js';
import watch from '../../lib/monitor/watch.js';

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
