/**
 * Manages the internal config of nodemon, checking for the state of support
 * with fs.watch, how nodemon can watch files (using find or fs methods).
 *
 * This is *not* the user's config.
 */
const debug = require('debug')('nodemon');
const load = require('./load');
const rules = require('../rules');
const utils = require('../utils');
const pinVersion = require('../version').pin;
const command = require('./command');
const rulesToMonitor = require('../monitor/match').rulesToMonitor;
const bus = utils.bus;

function reset() {
  rules.reset();

  config.dirs = [];
  config.options = { ignore: [], watch: [] };
  config.lastStarted = 0;
  config.loaded = [];
}

const config = {
  run: false,
  system: {
    cwd: process.cwd(),
  },
  required: false,
  dirs: [],
  timeout: 1000,
  options: {},
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
  const _config = this;

  load(settings, _config.options, _config, function (options) {
    _config.options = options;

    if (options.watch.length === 0) {
      // this is to catch when the watch is left blank
      options.watch.push('*.*');
    }

    if (options['watch_interval']) { // jshint ignore:line
      options.watchInterval = options['watch_interval']; // jshint ignore:line
    }

    _config.watchInterval = options.watchInterval || null;
    if (options.signal) {
      _config.signal = options.signal;
    }

    const cmd = command(_config.options);
    _config.command = {
      raw: cmd,
      string: utils.stringify(cmd.executable, cmd.args),
    };

    // now run automatic checks on system adding to the config object
    options.monitor = rulesToMonitor(options.watch, options.ignore, config);

    const cwd = process.cwd();
    debug('config: dirs', _config.dirs);
    if (_config.dirs.length === 0) {
      _config.dirs.unshift(cwd);
    }

    bus.emit('config:update', _config);
    pinVersion().then(function () {
      ready(_config);
    }).catch(e => {
      // this doesn't help testing, but does give exposure on syntax errors
      console.error(e.stack);
      throw e;
    });
  });
};

config.reset = reset;

module.exports = config;
