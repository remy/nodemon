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
      // Then merge over with the user settings (which might be parsed
      // from the cli).
      // Note that utils.merge protects and favours existing values over
      // new values.
      config = utils.merge(settings, config);

      // add in any missing defaults
      var defaults = {
        watch: [],
        ignore: [],
        stdin: true,
        verbose: false,
        ext: 'js'
      };
      config = utils.merge(config, defaults);

      var ext = config.ext;

      // allow users to make a mistake on the extention to monitor
      // converts js,jade => .js$|.jade$
      // and 'js jade' => .js$|.jade$
      // BIG NOTE: user can't do this: nodemon -e *.js
      // because the terminal will automatically expand the glob against
      // the file system :(
      if (ext.indexOf(' ') !== -1 || ext.indexOf(',') !== -1 || ext.indexOf('*.') !== -1) {
        ext = ext.replace(/\s+/g, '|').replace(/,/g, '|').split('|').map(function (item) {
          return '.' + item.replace(/^[\*\.]+/, '');
        }).join('$|');
      }

      // this final part ensures both multiple ext and single extensions work
      ext += '$';

      config.ext = ext;

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
    // prefer the local nodemon.json and fill in missing items using
    // the global config
    ready(utils.merge(settings, config));
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