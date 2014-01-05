'use strict';

var minimatch = require('minimatch'),
    utils = require('../utils');

module.exports = match;

function match(files, userRules) {
  var rules = userRules.sort(function (a, b) {
    return b.split('/').length - a.split('/').length;
  }).map(function (s) {
    var prefix = s.slice(0, 1);
    if (prefix === '!') {
      return '!**/' + s.slice(1);
    }
    return '**/' + s;
  });

  var good = [],
      ignored = 0,
      watched = 0;

  files.forEach(function (file) {
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].slice(0, 1) === '!') {
        if (!minimatch(file, rules[i])) {
          ignored++;
          break;
        }
      } else {
        if (minimatch(file, rules[i])) {
          watched++;
          utils.log.detail('matched rule: ' + rules[i]);
          good.push(file);
          break;
        }
      }
    }
  });

  return {
    result: good,
    ignored: ignored,
    watched: watched,
    total: files.length
  };
}