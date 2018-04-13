module.exports.watch = watch;
module.exports.resetWatchers = resetWatchers;

const debug = require('debug')('nodemon:watch');
const debugRoot = require('debug')('nodemon');
const chokidar = require('chokidar');
const undefsafe = require('undefsafe');
const config = require('../config');
const path = require('path');
const fs = require('fs');
const utils = require('../utils');
const bus = utils.bus;
const match = require('./match');

let watchers = [];
let debouncedBus;

bus.on('reset', resetWatchers);

function resetWatchers() {
  debugRoot('resetting watchers');
  watchers.forEach(function (watcher) {
    watcher.close();
  });
  watchers = [];
}

function watch() {
  if (watchers.length) {
    debug('early exit on watch, still watching (%s)', watchers.length);
    return;
  }

  let dirs = [].slice.call(config.dirs);

  debugRoot('start watch on: %s', dirs.join(', '));
  const rootIgnored = config.options.ignore;
  debugRoot('ignored', rootIgnored);

  let watchedFiles = [];

  const promise = new Promise(function (resolve) {
    const dotFilePattern = /[/\\]\./;
    const ignored = Array.from(rootIgnored);
    const addDotFile = dirs.filter(dir => dir.match(dotFilePattern));

    // don't ignore dotfiles if explicitly watched.
    if (addDotFile.length === 0) {
      ignored.push(dotFilePattern);
    }

    dirs = dirs.map(dir => {
      // if the directory is a file, it somehow causes
      // windows to lose the filename upon change
      if (fs.statSync(dir).isFile()) {
        dir = path.dirname(dir);
      }

      return dir;
    });

    const watchOptions = {
      ignorePermissionErrors: true,
      cwd: process.cwd(), // dir,
      ignored: ignored,
      persistent: true,
      usePolling: config.options.legacyWatch || false,
      interval: config.options.pollingInterval,
    };

    if (utils.isWindows) {
      watchOptions.disableGlobbing = true;
    }

    if (process.env.TEST) {
      watchOptions.useFsEvents = false;
    }

    const watcher = chokidar.watch(
      dirs,
      Object.assign({}, watchOptions, config.watchOptions || {})
    );

    watcher.ready = false;

    let total = 0;

    watcher.on('change', filterAndRestart);
    watcher.on('add', function (file) {
      if (watcher.ready) {
        return filterAndRestart(file);
      }

      watchedFiles.push(file);
      watchedFiles = Array.from(new Set(watchedFiles)); // ensure no dupes
      total = watchedFiles.length;
      bus.emit('watching', file);
      debug('watching dir: %s', file);
    });
    watcher.on('ready', function () {
      watcher.ready = true;
      resolve(total);
      debugRoot('watch is complete');
    });

    watcher.on('error', function (error) {
      if (error.code === 'EINVAL') {
        utils.log.error(
          'Internal watch failed. Likely cause: too many ' +
          'files being watched (perhaps from the root of a drive?\n' +
          'See https://github.com/paulmillr/chokidar/issues/229 for details'
        );
      } else {
        utils.log.error('Internal watch failed: ' + error.message);
        process.exit(1);
      }
    });

    watchers.push(watcher);
  });

  return promise.catch(e => {
    setTimeout(() => {
      throw e;
    });
  }).then(function () {
    utils.log.detail(`watching ${watchedFiles.length} file${
      watchedFiles.length === 1 ? '' : 's'}`);
    return watchedFiles;
  });
}

function filterAndRestart(files) {
  if (!Array.isArray(files)) {
    files = [files];
  }

  if (files.length) {
    const cwd = this.options ? this.options.cwd : process.cwd();

    utils.log.detail(
      'files triggering change check: ' +
      files
        .map(function (file) {
          return path.relative(cwd, file);
        })
        .join(', ')
    );

    files = files.map(file => {
      return path.relative(process.cwd(), path.join(cwd, file));
    });

    if (utils.isWindows) {
      // ensure the drive letter is in uppercase (c:\foo -> C:\foo)
      files = files.map(function (f) {
        return f[0].toUpperCase() + f.slice(1);
      });
    }

    debug('filterAndRestart on', files);

    let matched = match(
      files,
      config.options.monitor,
      undefsafe(config, 'options.execOptions.ext')
    );

    debug('matched?', JSON.stringify(matched));

    // if there's no matches, then test to see if the changed file is the
    // running script, if so, let's allow a restart
    if (config.options.execOptions.script) {
      const script = path.resolve(config.options.execOptions.script);

      if (matched.result.length === 0 && script) {
        const length = script.length;

        files.find(file => {
          if (file.substr(-length, length) === script) {
            matched = {
              result: [file],
              total: 1,
            };

            return true;
          }
        });
      }
    }

    utils.log.detail(
      'changes after filters (before/after): ' +
      [files.length, matched.result.length].join('/')
    );

    // reset the last check so we're only looking at recently modified files
    config.lastStarted = Date.now();

    if (matched.result.length) {
      if (config.options.delay > 0) {
        utils.log.detail('delaying restart for ' + config.options.delay + 'ms');

        if (debouncedBus === undefined) {
          debouncedBus = debounce(restartBus, config.options.delay);
        }
        debouncedBus(matched);
      } else {
        return restartBus(matched);
      }
    }
  }
}

function restartBus(matched) {
  utils.log.status('restarting due to changes...');
  matched.result.map(function (file) {
    utils.log.detail(path.relative(process.cwd(), file));
  });

  if (config.options.verbose) {
    utils.log._log('');
  }

  bus.emit('restart', matched.result);
}

function debounce(fn, delay) {
  let timer = null;

  return function () {
    const args = arguments;

    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
