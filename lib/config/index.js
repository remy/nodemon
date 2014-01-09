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
    fs = require('fs'),
    path = require('path'),
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

    if (options.watch && options.watch.length) {
      options.monitor = utils.clone(options.watch);
    }

    if (options.ignore) {
      [].push.apply(options.monitor, (options.ignore || []).map(function (rule) {
        return '!' + rule;
      }));
    }

    // if (options.execOptions.ext) {
    //   options.execOptions.ext.split(',').forEach(function (ext) {
    //     options.monitor.push(ext);
    //   });
    // }

    // delete options.watch;
    // delete options.ignore;

    var cwd = process.cwd();

    if (config.dirs.length === 0) {
      config.dirs.unshift(cwd);
    }

    // next check if the monitored paths are actual directories
    // or just patterns - and expand the rule to include *.*
    options.monitor = options.monitor.map(function (rule) {
      var not = rule.slice(0, 1) === '!';

      if (rule.slice(-1) === '/') {
        // just slap on a * anyway
        return rule + '*';
      }

      if (not) {
        rule = rule.slice(1);
      }

      var dir = path.resolve(cwd, rule);

      try {
        var stat = fs.statSync(dir);
        if (stat.isDirectory()) {
          if (rule.slice(-1) !== '/') {
            rule += '/';
          }
          rule += '**/*';
        }
      } catch (e) {}
      return (not ? '!' : '') + rule;
    });

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

