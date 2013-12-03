var fs = require('fs'),
    path = require('path'),
    utils = require('../utils'),
    exec = require('./exec'),
    defaults = require('./defaults');

module.exports = load;

/**
 * Load the nodemon config, first reading the global root/nodemon.json, then
 * the local nodemon.json to the exec and then overwritting using any user
 * specified settings (i.e. from the cli)
 *
 * @param  {Object} settings user defined settings
 * @param  {Function} ready    callback that recieves complete config
 */
function load(settings, options, config, ready) {
  config.loaded = [];
  // first load the root nodemon.json
  loadFile(options, config, utils.home, function (options) {
    // then load the user's local nodemon.json
    loadFile(options, config, process.cwd(), function (options) {
      // Then merge over with the user settings (parsed from the cli).
      // Note that merge protects and favours existing values over new values,
      // and thus command line arguments get priority
      options = utils.merge(settings, options);

      // add in any missing defaults
      options = utils.merge(options, defaults);

      // work out the execOptions based on the final config we have
      options.execOptions = exec({
        script: options.script,
        exec: options.exec,
        nodeArgs: options.nodeArgs,
        ext: options.ext
      }, options.extensionMap);


      if (options.verbose) {
        utils.debug = true;
      }

      if (options.quiet) {
        utils.quiet();
      }

      ready(options);
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
function loadFile(options, config, dir, ready) {
  if (!ready) ready = function () {};

  var callback = function (settings) {
    // prefer the local nodemon.json and fill in missing items using
    // the global options
    ready(utils.merge(settings, options));
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
      config.loaded.push(filename);
    } catch (e) {
      console.error(e);
      utils.log.fail('Failed to parse config ' + filename);
    }

    // options values will overwrite settings
    callback(settings)
  });


}