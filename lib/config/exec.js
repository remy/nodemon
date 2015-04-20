'use strict';
var path = require('path'),
    utils = require('../utils');

module.exports = exec;

/**
 * Reads the cwd/package.json file and looks to see if it can load a script
 * and possibly an exec first from package.main, then package.start.
 *
 * @return {Object} exec & script if found
 */
function execFromPackage() {
  // doing a try/catch because we can't use the path.exist callback pattern
  // or we could, but the code would get messy, so this will do exactly
  // what we're after - if the file doesn't exist, it'll throw.
  try {
    // note: this isn't nodemon's package, it's the user's cwd package
    var pkg = require(path.join(process.cwd(), 'package.json'));
    if (pkg.main !== undefined) {
      // no app found to run - so give them a tip and get the feck out
      return { exec: null, script: pkg.main };
    } else if (pkg.scripts && pkg.scripts.start) {
      var start = pkg.scripts.start.split(' ');
      return { exec: start[0], script: start.slice(1).join(' ') };
    }
  } catch (e) {}

  return null;
}

function replace(map, str) {
  return str.replace(new RegExp('\{\{(' + Object.keys(map).join('|') + ')\}\}'), function (all, m) {
    return map[m] || all || '';
  });
}


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

  // if there's no exec found yet, then try to read it from the local package.json
  // this logic used to sit in the cli/parse, but actually the cli should be parsed
  // first, then the user options (via nodemon.json) then finally default down to
  // pot shots at the directory via package.json
  if (!nodemonOptions.exec && !nodemonOptions.script) {
    var found = execFromPackage();
    if (found !== null) {
      if (found.exec) {
        nodemonOptions.exec = found.exec;
      }
      if (!nodemonOptions.script) {
        nodemonOptions.script = found.script;
      }
      if (Array.isArray(nodemonOptions.args) && nodemonOptions.scriptPosition === null) {
        nodemonOptions.scriptPosition = nodemonOptions.args.length;
      }
    }
  }

  var options = utils.clone(nodemonOptions || {}),
      script = path.basename(options.script || ''),
      scriptExt = path.extname(script).slice(1),
      extension = options.ext || scriptExt || 'js',
      execDefined = !!options.exec;

  // strip any leading periods int he extension
  if (extension.indexOf('.') === 0) {
    extension = extension.slice(1);
  }

  // allows the user to simplify cli usage: https://github.com/remy/nodemon/issues/195
  // but always give preference to the user defined argument
  if (!options.exec && execMap[scriptExt] !== undefined) {
    options.exec = execMap[scriptExt];
    execDefined = true;
  }

  options.execArgs = [];

  if (Array.isArray(options.exec)) {
    options.execArgs = options.exec;
    options.exec = options.execArgs.shift();
  }

  if (options.exec === undefined) {
    options.exec = 'node';
  } else {
    // allow variable substitution for {{filename}} and {{pwd}}
    var substitution = replace.bind(null, { filename: options.script, pwd: process.cwd() });
    var newExec = substitution(options.exec);
    if (newExec !== options.exec && options.exec.indexOf('{{filename}}') !== -1) {
      options.script = null;
    }
    options.exec = newExec;

    var newExecArgs = options.execArgs.map(substitution);
    if (newExecArgs.join('') !== options.execArgs.join('')) {
      options.execArgs = newExecArgs;
      delete options.script;
    }
  }


  if (options.exec === 'node' && options.nodeArgs && options.nodeArgs.length) {
    options.execArgs = options.execArgs.concat(options.nodeArgs);
  }

  // note: indexOf('coffee') handles both .coffee and .litcoffee
  if (!execDefined && options.exec === 'node' && scriptExt.indexOf('coffee') !== -1) {
    options.exec = 'coffee';

    // we need to get execArgs set before the script
    // for example, in `nodemon --debug my-script.coffee --my-flag`, debug is an
    // execArg, while my-flag is a script arg
    var leadingArgs = (options.args || []).splice(0, options.scriptPosition);
    options.execArgs = options.execArgs.concat(leadingArgs);
    options.scriptPosition = 0;

    if (options.execArgs.length > 0) {
      // because this is the coffee executable, we need to combine the exec args
      // into a single argument after the nodejs flag
      options.execArgs = ['--nodejs', options.execArgs.join(' ')];
    }
  }

  if (options.exec === 'coffee') {
    // don't override user specified extension tracking
    if (!options.ext) {
      extension = 'coffee litcoffee js';
    }

    // because windows can't find 'coffee', it needs the real file 'coffee.cmd'
    if (utils.isWindows) {
      options.exec += '.cmd';
    }
  }

  // allow users to make a mistake on the extension to monitor
  // converts js,jade => js,jade
  // and 'js jade' => js,jade
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
        return item.replace(/^[\*\.]+/, ''); // remove "*."
      }).join(','); // return regexp string like: js,jade
  }

  options.ext = extension;

  options.env = {};
  // make sure it's an object (and since we don't have )
  if (({}).toString.apply(nodemonOptions.env) === '[object Object]') {
    options.env = utils.clone(nodemonOptions.env);
  } else if (nodemonOptions.env !== undefined) {
    throw new Error('nodemon env values must be an object: { PORT: 8000 }');
  }

  return options;
}