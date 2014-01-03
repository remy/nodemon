'use strict';
/**
 * Manages the internal config of nodemon, checking for the state of support
 * with fs.watch, how nodemon can watch files (using find or fs methods).
 *
 * This is *not* the user's config.
 */
var load = require('./load'),
    rules = require('../rules'),
    utils = require('../utils'),
    bus = utils.bus,
    checkWatchSupport = require('./checkWatchSupport');

function reset() {
  rules.reset();

  config.dirs = [];
  config.ignoring = [];
  config.watch = [];
  config.options = { ignore: [], watch: [] };
  config.lastStarted = 0;
  config.loaded = [];
}

var config = {
  system: {
    noWatch: false,
    watchWorks: false,
  },
  required: false,
  dirs: [],
  ignoring: [],
  timeout: 1000,
  options: {}
};

/**
 * Take user defined settings, then detect the local machine capability, then
 * look for local and global nodemon.json files and merge together the final
 * settings with the config for nodemon.
 *
 * @param  {Object} settings user defined settings for nodemon (typically on
 *  the cli)
 * @param  {Function} ready callback fired once the config is loaded
 */
config.load = function (settings, ready) {
  reset();
  var config = this;
  load(settings, config.options, config, function (options) {
    config.options = options;

    if (!options.monitor) {
      options.monitor = utils.clone(options.watch || ['*.*']);

      options.monitor.push.apply((options.ignore || []).map(function (rule) {
        return '!' + rule;
      }));
    }

    if (options.execOptions.ext) {
      options.execOptions.ext.split(',').forEach(function (ext) {
        options.monitor.push('*' + ext);
      });
    }

    delete options.watch;
    delete options.ignore;

    if (config.dirs.length === 0) {
      config.dirs.unshift(process.cwd());
    }

    // now run automatic checks on system adding to the config object
    checkWatchSupport(config, function (config) {
      bus.emit('config:update', config);
      ready(config);
    });
  });
};

config.reset = reset;

module.exports = config;

