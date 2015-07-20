'use strict';
var fs = require('fs');
var config = require('../config');
var offset = null;
var filename = './.nodemon-offset';

module.exports = function () {
  if (config.options.novm) {
    offset = 0;
    return offset;
  }

  if (offset === null) {
    try { // being lazy, but sometimes we can't write the offset file
      fs.writeFileSync(filename, 'offset-test');
      var stat = fs.statSync(filename);
      var hostTime = stat.mtime.getTime();
      fs.unlinkSync(filename);
      var clientTime = Date.now();
      offset = hostTime - clientTime;
    } catch (e) {
      offset = 0;
    }
  }

  if (offset < 1000) {
    offset = 0;
  }

  config.offset = offset;

  return offset;
};

module.exports.refresh = function() {
  offset = null;
};

module.exports.pretty = function () {
  var date = new Date(offset);
  return two(date.getHours()) + 'h' + two(date.getMinutes()) + 'm' + two(date.getSeconds()) + 's';
};

function two(s) {
  s += '';
  return s.length === 2 ? s : '0' + s;
}