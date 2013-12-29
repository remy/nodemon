'use strict';
var path = require('path'),
    utils = require('../utils');

module.exports = exec;

/**
 * Discovers all the options required to run the script
 * and if a custom exec has been passed in, then it will
 * also try to work out what extensions to monitor and
 * whether there's a special way of running that script.
 *
 * @param  {Object} nodemonOptions
 * @param  {Object} execMap
 * @return {Object} new and updated version of nodemonOptions
 */
function exec(nodemonOptions, execMap) {
  if (!execMap) {
    execMap = {};
  }

  var options = utils.clone(nodemonOptions || {}),
      script = path.basename(options.script || ''),
      scriptExt = path.extname(script),
      extension = options.ext || scriptExt || '.js';

  // allows the user to simplify cli usage: https://github.com/remy/nodemon/issues/195
  if (execMap[extension.slice(1)] !== undefined) {
    options.exec = execMap[extension.slice(1)];
  }

  if (options.exec === undefined) {
    options.exec = 'node';
  } else {
    // allow variable substitution for {{filename}} and {{pwd}}
    options.exec = (options.exec || '').replace(/\{\{(filename|pwd)\}\}/, function (all, m) {
      if (m === 'filename') {
        return script || '';
      } else if (m === 'pwd') {
        return process.cwd() || '';
      }
      return all;
    });
  }

  options.execArgs = [];

  if (options.exec.indexOf(' ') !== -1) {
    var execOptions = options.exec.split(' ');
    options.exec = execOptions.splice(0, 1)[0];
    options.execArgs = execOptions;
  }

  if (options.exec === 'node' && options.nodeArgs && options.nodeArgs.length) {
    options.execArgs = options.execArgs.concat(options.nodeArgs);
  }

  // note: indexOf('coffee') handles both .coffee and .litcoffee
  if (options.exec === 'node' && scriptExt.indexOf('coffee') !== -1) {
    options.exec = 'coffee';
    // ensure that we call: `coffee --nodejs ...`
    if (options.execArgs === undefined) {
      options.execArgs = [];
    }

    if (options.execArgs.length && options.execArgs.indexOf('--nodejs') === -1) {
      options.execArgs.unshift('--nodejs');
    }
  }

  if (options.exec === 'coffee') {
    // don't override user specified extension tracking
    if (!options.ext) {
      extension = '.coffee|.litcoffee|.js';
    }

    // because windows can't find 'coffee', it needs the real file 'coffee.cmd'
    if (utils.isWindows) {
      options.exec += '.cmd';
    }
  }

  // allow users to make a mistake on the extension to monitor
  // converts js,jade => .js$|.jade$
  // and 'js jade' => .js$|.jade$
  // BIG NOTE: user can't do this: nodemon -e *.js
  // because the terminal will automatically expand the glob against
  // the file system :(
  if (extension.indexOf(' ') !== -1 ||
      extension.indexOf(',') !== -1 ||
      extension.indexOf('*.') !== -1) {

    extension = extension.replace(/\s+/g, '|') // convert spaces to pipes
      .replace(/,/g, '|') // convert commas to pipes
      .split('|') // split on those pipes
      .map(function (item) {
        return '.' + item.replace(/^[\*\.]+/, ''); // remove "*."
      }).join('$|'); // return regexp string like: .js$|.jade$
  }

  // this final part ensures both multiple extension and
  // single extensions work
  extension += '$';

  options.ext = extension;

  return options;
}