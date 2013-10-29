/**
 * Manages the internal config of nodemon, checking for the state of support
 * with fs.watch, how nodemon can watch files (using find or fs methods).
 *
 * This is *not* the user's config.
 */
var load = require('./load'),
    checkWatchSupport = require('./checkWatchSupport'),
    rules = require('../rules'),
    path = require('path'),
    fs = require('fs'),
    existsSync = fs.existsSync || path.existsSync;

var config = {
  system: {
    noWatch: false,
    watchWorks: false,
  },
  dirs: [],
  ignoring: [],
  timeout: 1000,
  options: {}
};

module.exports = config;

/**
 * Take user defined settings, then detect the local machine capability, then
 * look for local and global nodemon.json files and merge together the final
 * settings with the config for nodemon.
 *
 * @param  {Object} settings user defined settings for nodemon (typically on the cli)
 * @param  {[type]} ready    callback fired once the config is loaded
 */
module.exports.load = function (settings, ready) {
  load(settings, config.options, function (c) {
    config.options = c;

    // convert ignore and watch options to rules/regexp
    rules.watch.add(config.options.watch);
    rules.ignore.add(config.options.ignore);

    // read directories to monitor
    if (config.options.watch && config.options.watch.length > 0) {
      config.options.watch.forEach(function (dir) {
        dir = path.resolve(dir);
        if (existsSync(dir)) config.dirs.push(path.resolve(dir));
      });
    } else {
      config.dirs.unshift(process.cwd());
    }

    // normalise the watch and ignore arrays
    config.options.watch = rules.rules.watch;
    config.options.ignore = rules.rules.ignore;

    // now run automatic checks on system adding to the config object
    checkWatchSupport(config, ready);
  })
};
