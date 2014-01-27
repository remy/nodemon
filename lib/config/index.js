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
    command = require('./command'),
    rulesToMonitor = require('../monitor/match').rulesToMonitor,
    bus = utils.bus,
    checkWatchSupport = require('./checkWatchSupport');

function reset() {
  rules.reset();

  config.dirs = [];
  config.options = { ignore: [], watch: [] };
  config.lastStarted = 0;
  config.loaded = [];
}

var config = {
  run: false,
  system: {
    cwd: process.cwd(),
    useFind: false,
    useWatch: false,
    useWatchFile: false,
  },
  required: false,
  dirs: [],
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

    if (options.watch.length === 0) {
      // this is to catch when the watch is left blank
      options.watch.push('*.*');
    }

    options.monitor = rulesToMonitor(options.watch, options.ignore, config);

    var cwd = process.cwd();
    if (config.dirs.length === 0) {
      config.dirs.unshift(cwd);
    }

    var cmd = command(config.options);
    config.command = {
      raw: cmd,
      string: cmd.executable + (cmd.args.length ? ' ' + cmd.args.join(' ') : '')
    };

    // now run automatic checks on system adding to the config object
    checkWatchSupport(config, function (config) {
      if (config.system.useFind === false && config.system.useWatch === false) {
        config.system.useWatchFile = true;
      }
      bus.emit('config:update', config);
      ready(config);
    });
  });
};

config.reset = reset;

module.exports = config;

