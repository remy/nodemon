'use strict';

var minimatch = require('minimatch'),
    path = require('path'),
    utils = require('../utils');

module.exports = match;

function match(files, monitor, ext) {
  // sort the rules by highest specificity (based on number of slashes)
  // TODO actually check separator rules work on windows
  var rules = monitor.sort(function (a, b) {
    var r = b.split(path.sep).length - a.split(path.sep).length;

    if (r === 0) {
      return b.length - a.length;
    }
    return r;
  }).map(function (s) {
    var prefix = s.slice(0, 1),
        sep = path.sep;

    if (prefix === '!') {
      return '!**' + (s.slice(0, 1) !== path.sep ? path.sep : '') + s.slice(1);
    }
    return '**' + (s.slice(0, 1) !== path.sep ? path.sep : '') + s;
  });

  var good = [],
      whitelist = [], // files that we won't check against the extension
      ignored = 0,
      watched = 0;

  files.forEach(function (file) {
    var matched = false;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].slice(0, 1) === '!') {
        if (!minimatch(file, rules[i])) {
          ignored++;
          matched = true;
          break;
        }
      } else {
        if (minimatch(file, rules[i])) {
          watched++;
          utils.log.detail('matched rule: ' + rules[i]);

          // if the rule doesn't match the WATCH EVERYTHING
          // but *does* match a rule that ends with *.*, then
          // white list it - in that we don't run it through
          // the extension check too.
          if (rules[i] !== '**' + path.sep + '*.*' && rules[i].slice(-3) === '*.*') {
            whitelist.push(file);
          } else {
            good.push(file);
          }
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      ignored++;
    }
  });

  // finally check the good files against the extensions that we're monitoring
  if (ext) {
    if (ext.indexOf(',') === -1) {
      ext = '**/*.' + ext;
    } else {
      ext = '**/*.{' + ext + '}';
    }

    // console.log('before', good, ext);
    good = good.filter(function(file) {
      return minimatch(file, ext);
    });
  } // else assume *.*

  return {
    result: good.concat(whitelist),
    ignored: ignored,
    watched: watched,
    total: files.length
  };
}