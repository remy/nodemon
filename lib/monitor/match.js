'use strict';

var minimatch = require('minimatch'),
    path = require('path'),
    utils = require('../utils');

module.exports = match;

function match(files, monitor, ext) {
  // sort the rules by highest specificity (based on number of slashes)
  // TODO actually check separator rules work on windows
  var rules = monitor.sort(function (a, b) {
    return b.split(path.sep).length - a.split(path.sep).length;
  }).map(function (s) {
    var prefix = s.slice(0, 1);
    if (prefix === '!') {
      return '!**' + path.sep + s.slice(1);
    }
    return '**' + path.sep + s;
  });

  var good = [],
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
          good.push(file);
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
    result: good,
    ignored: ignored,
    watched: watched,
    total: files.length
  };
}