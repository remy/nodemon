var path = require('path'),
    utils = require('../utils');

module.exports = executable;

function executable(script, nodemonOptions, extentionMap) {
  var options = utils.clone(nodemonOptions || {});
  if (!extentionMap) extentionMap = {};

  script = path.basename(script);
  var extention = options.ext || path.extname(script);


  if (options.exec === undefined) {
    options.exec = 'node';
  }

  if (options.exec.indexOf(' ') !== -1) {
    var execOptions = options.exec.split(' ');
    options.exec = execOptions.splice(0, 1)[0];
    options.execArgs = execOptions.join(' ');
  }

  if (extentionMap[extention] !== undefined) {
    options.exec = extentionMap[extention];
  }
  // note: indexOf('coffee') handles both .coffee and .litcoffee
  else if (options.exec === 'node' && extention.indexOf('coffee') !== -1) {
    options.exec = 'coffee';
    // ensure that we call: `coffee --nodejs ...`
    if (options.execArgs === undefined) options.execArgs = [];

    if (options.execArgs.indexOf('--nodejs') === -1) {
      options.execArgs.unshift('--nodejs');
    }
  }

  if (options.exec === 'coffee') {
    // coffeescript requires --nodejs --debug
    // this code is a dance to get the order of the debug flags right when combined with coffeescript
    if (options.nodeArgs) {
      options.execArgs = options.execArgs.concat(options.nodeArgs);
    }

    // don't override user specified extention tracking
    if (!options.ext) {
      extention = '.coffee|.litcoffee|.js';
    }

    // because windows can't find 'coffee', it needs the real file 'coffee.cmd'
    if (utils.isWindows) {
      options.exec += '.cmd';
    }
  }

  // allow users to make a mistake on the extention to monitor
  // converts js,jade => .js|.jade
  // BIG NOTE: user can't do this: nodemon -e *.js
  // because the terminal will automatically expand the glob against the file system :(
  if (extention.indexOf(',') !== -1 || extention.indexOf('*.') !== -1) {
    extention = extention.replace(/,/g, '|').split('|').map(function (item) {
      return '.' + item.replace(/^[\*\.]+/, '');
    }).join('$|');
  }

  options.ext = extention;

  return options;
}