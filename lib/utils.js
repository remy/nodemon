var util = require('util'),
    colors = require('colors');

var log = function (msg) {
  util.log(('[nodemon] ' + msg));
};

log.log = function (msg) {
  util.log(('[nodemon] ' + msg));
};
  // info is for messages about how to use nodemon, like `rs` restart
log.info = function (msg) {
  console.log('msg', msg);
  util.log(('[nodemon] ' + msg).magenta);
};
  // status is messages about nodemon state, like restarting
log.status = function (msg) {
  util.log(('[nodemon] ' + msg).green);
};
  // non fatal warnings
log.fail = function (msg) {
  util.log(('[nodemon] ' + msg).red);
};
  // big bad errors
log.error = function (msg) {
  util.error(('[nodemon] ' + msg).red);
};

// via http://stackoverflow.com/a/728694/22617
function clone(obj) {
  // Handle the 3 simple types, and null or undefined
  if (null === obj || "object" !== typeof obj) {
    return obj;
  }

  var copy;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr]);
      }
    }
    return copy;
  }

  throw new Error('Unable to copy obj! Its type isn\'t supported.');
}

module.exports = {
  isWindows: process.platform === 'win32',
  clone: clone,
  log: log
};