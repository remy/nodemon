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
      Object.keys(this.log).forEach(function (method) {
        this.log[method] = noop;
      }.bind(this));
    }
  },
  reset: function () {
    if (!this.debug) {
      Object.keys(this.log).forEach(function (method) {
        delete this.log[method];
      }.bind(this));
    }
    this.debug = false;
  },
  regexpToText: function (t) {
    return t.replace(/\.\*\\./g, '*.').replace(/\\{2}/g, '^^').replace(/\\/g, '').replace(/\^\^/g, '\\');
  }
};

utils.log = require('./log')(utils.isRequired);

Object.defineProperty(utils, 'debug', {
  set: function (value) {
    this.log.debug = value;
  },
  get: function () {
    return this.log.debug;
  }
});