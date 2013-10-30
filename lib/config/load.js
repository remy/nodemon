var fs = require('fs'),
    path = require('path'),
    utils = require('../utils');

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
      config = utils.merge(config, settings);

      // add in any missing defaults
      var defaults = {
        watch: [],
        ignore: [],
        verbose: false,
        ext: 'js'
      };
      config = utils.merge(config, defaults);

      var extention = config.ext;

      // allow users to make a mistake on the extention to monitor
      // converts js,jade => .js|.jade
      // BIG NOTE: user can't do this: nodemon -e *.js
      // because the terminal will automatically expand the glob against the file system :(
      if (extention.indexOf(',') !== -1 || extention.indexOf('*.') !== -1) {
        extention = extention.replace(/,/g, '|').split('|').map(function (item) {
          return '.' + item.replace(/^[\*\.]+/, '');
        }).join('$|');
      }

      config.ext = extention;

      if (config.verbose) {
        utils.debug = true;
      }

      if (config.quiet) {
        utils.quiet();
      }

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
    ready(utils.merge(config, settings));
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