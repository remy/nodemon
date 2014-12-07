'use strict';
var noop = function () {},
    path = require('path');

var utils = module.exports = {
  clone: require('./clone'),
  merge: require('./merge'),
  bus: require('./bus'),
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isRequired: (function () {
    var p = module;
    while (p = p.parent) {
      if (p.filename.indexOf('bin' + path.sep + 'nodemon.js') !== -1) {
        return false;
      }
    }

    return true;
  })(),
  home: process.env.HOME || process.env.HOMEPATH,
  quiet: function () {
    // nukes the logging
    if (!this.debug) {
      for (var method in utils.log) {
        if (typeof utils.log[method] === 'function') {
          utils.log[method] = noop;
        }
      }
    }
  },
  reset: function () {
    if (!this.debug) {
      for (var method in utils.log) {
        if (typeof utils.log[method] === 'function') {
          delete utils.log[method];
        }
      }
    }
    this.debug = false;
  },
  regexpToText: function (t) {
    return t.replace(/\.\*\\./g, '*.').replace(/\\{2}/g, '^^').replace(/\\/g, '').replace(/\^\^/g, '\\');
  }
};

utils.log = require('./log')(utils.isRequired, utils.colours);

Object.defineProperty(utils, 'debug', {
  set: function (value) {
    this.log.debug = value;
  },
  get: function () {
    return this.log.debug;
  }
});

Object.defineProperty(utils, 'colours', {
  set: function (value) {
    this.log.useColours = value;
  },
  get: function () {
    return this.log.useColours;
  }
});