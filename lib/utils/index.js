var noop = function () {};

var utils = module.exports = {
  clone: require('./clone'),
  merge: require('./merge'),
  log: require('./log'),
  bus: require('./bus'),
  isWindows: process.platform === 'win32',
  home: process.env.HOME || process.env.HOMEPATH,
  // debug: false,
  quiet: function () {
    // nukes the logging
    if (!this.debug) Object.keys(this.log).forEach(function (method) {
      this.log[method] = noop;
    }.bind(this));
  }
};

Object.defineProperty(utils, 'debug', {
  set: function (value) {
    this.log.debug = value;
  },
  get: function () {
    return this.log.debug;
  }
});