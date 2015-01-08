'use strict';
var fs = require('fs'),
    path = require('path'),
    exists = fs.exists || path.exists,
    utils = require('../utils'),
    rules = require('../rules'),
    parse = require('../rules/parse'),
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
function load(settings, options, config, callback) {
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
        args: options.args,
        scriptPosition: options.scriptPosition,
        nodeArgs: options.nodeArgs,
        ext: options.ext,
        env: options.env
      }, options.execMap);

      // clean up values that we don't need at the top level
      delete options.scriptPosition;
      delete options.script;
      delete options.args;
      delete options.ext;

      /*
      // if the script was discovered via package.main or package.start, it
      // would have happened in the `exec` function above, except `options.script`
      // doesn't get updated, when `options.execOptions.script` does actually
      // hold the right value now, so we copy it across along with the
      // scriptPosition as this is used in command.js to correctly construct
      // the executable command
      if (!options.script && options.execOptions.script) {
        options.script = options.execOptions.script;
        // options.scriptPosition = options.execOptions.scriptPosition;
      }
      */

      // copy the extension across to a user readable format
      // options.ext = options.execOptions.ext.replace(/[\*\.\$]/g, '').split('|').join(' ');

      if (options.quiet) {
        utils.quiet();
      }

      if (options.verbose) {
        utils.debug = true;
      }

      // simplify the ready callback to be called after the rules are normalised
      // from strings to regexp through the rules lib. Note that this gets
      // created *after* options is overwritten twice in the lines above.
      var ready = function (options) {
        normaliseRules(options, callback);
      };

      // if we didn't pick up a nodemon.json file & there's no cli ignores
      // then try loading an old style .nodemonignore file
      if (config.loaded.length === 0) {
        // TODO decide whether this is just confusing...
        var legacy = loadLegacyIgnore.bind(null, options, ready);

        // first try .nodemonignore, if that doesn't exist, try nodemon-ignore
        return legacy('.nodemonignore', function () {
          legacy('nodemon-ignore', function (options) {
            ready(options);
          });
        });
      }

      ready(options);
    });
  });
}

/**
 * Loads the old style nodemonignore files which are simply a list of patterns
 * in a file to ignore
 *
 * @param  {Object} options    nodemon user options
 * @param  {Function} success
 * @param  {String} filename   the ignore file (.nodemonignore or nodemon-ignore)
 * @param  {Function} fail     (optional) failure callback
 */
function loadLegacyIgnore(options, success, filename, fail) {
  var ignoreFile = path.join(process.cwd(), filename);

  exists(ignoreFile, function (exists) {
    if (exists) {
      return parse(ignoreFile, function (error, rules) {
        options.ignore = rules.raw;
        success(options);
      });
    }

    if (fail) {
      fail(options);
    } else {
      success(options);
    }
  });
}

function normaliseRules(options, ready) {
  // convert ignore and watch options to rules/regexp
  rules.watch.add(options.watch);
  rules.ignore.add(options.ignore);

  // normalise the watch and ignore arrays
  options.watch = rules.rules.watch;
  options.ignore = rules.rules.ignore;

  ready(options);
}

/**
 * Looks for a config in the current working directory, and a config in the
 * user's home directory, merging the two together, giving priority to local
 * config. This can then be overwritten later by command line arguments
 *
 * @param  {Function} ready callback to pass loaded settings to
 */
function loadFile(options, config, dir, ready) {
  if (!ready) {
    ready = function () {};
  }

  var callback = function (settings) {
    // prefer the local nodemon.json and fill in missing items using
    // the global options
    ready(utils.merge(settings, options));
  };

  if (!dir) {
    return callback({});
  }

  var filename = path.join(dir, 'nodemon.json');
  fs.readFile(filename, 'utf8', function (err, data) {
    if (err) {
      return callback({});
    }

    var settings = {};

    try {
      settings = JSON.parse(data);
      config.loaded.push(filename);
    } catch (e) {
      console.error(e);
      utils.log.fail('Failed to parse config ' + filename);
    }

    // options values will overwrite settings
    callback(settings);
  });


}
