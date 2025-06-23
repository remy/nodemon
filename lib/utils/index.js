import path from 'path';
import { type } from 'os';
import clone from './clone.js';
import merge from './merge.js';
import bus from './bus.js';
import Logger from './log.js';

var noop = function () { };

var utils = {
  clone: clone,
  merge: merge,
  bus: bus,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  isIBMi: type() === 'OS400',
  isRequired: false, // In ES modules, we assume it's always required
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
    return t
      .replace(/\.\*\\./g, '*.')
      .replace(/\\{2}/g, '^^')
      .replace(/\\/g, '')
      .replace(/\^\^/g, '\\');
  },
  stringify: function (exec, args) {
    // serializes an executable string and array of arguments into a string
    args = args || [];

    return [exec]
      .concat(
      args.map(function (arg) {
        // if an argument contains a space, we want to show it with quotes
        // around it to indicate that it is a single argument
        if (arg.length > 0 && arg.indexOf(' ') === -1) {
          return arg;
        }
        // this should correctly escape nested quotes
        return JSON.stringify(arg);
      })
      )
      .join(' ')
      .trim();
  },
};

utils.log = new Logger(utils.isRequired);

Object.defineProperty(utils, 'debug', {
  set: function (value) {
    this.log.debug = value;
  },
  get: function () {
    return this.log.debug;
  },
});

Object.defineProperty(utils, 'colours', {
  set: function (value) {
    this.log.useColours = value;
  },
  get: function () {
    return this.log.useColours;
  },
});

export default utils;
