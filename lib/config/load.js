var fs = require('fs'),
    path = require('path'),
    utils = require('../utils'),
    mixin = require('object-mixin');

module.exports = load;

/**
 * Load the nodemon config, first reading the global root/nodemon.json, then
 * the local nodemon.json to the exec and then overwritting using any user
 * specified settings (i.e. from the cli)
 * @param  {Object} settings user defined settings
 * @param  {Function} ready    callback that recieves complete config
 */
function load(settings, config, ready) {
  // first load the root nodemon.json
  loadFile(config, utils.home, function (config) {
    // then load the user's local nodemon.json
    loadFile(config, process.cwd(), function (config) {
      // then merge over with the user settings (which might be parsed from the cli)
      config = Object.mixin(config, settings);

      ready(config);
    });
  });
}

/**
 * Looks for a config in the current working directory, and a config in the
 * user's home directory, merging the two together, giving priority to local
 * config. This can then be overwritten later by command line arguments
 *
 * @param  {Function} ready callback to pass loaded settings to
 */
function loadFile(config, dir, ready) {
  if (!ready) ready = function () {};

  var callback = function (settings) {
    ready(Object.mixin(config, settings));
  };

  var filename = path.join(dir, 'nodemon.json');
  fs.readFile(filename, 'utf8', function (err, data) {
    if (err) {
      return callback({});
    }

    utils.log.detail('reading config ' + filename);

    var settings = {};

    try {
      settings = JSON.parse(data);
    } catch (e) {
      utils.log.fail('Failed to parse local nodemon.json');
    }

    // config values will overwrite settings
    callback(settings)
  });


}