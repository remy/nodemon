'use strict';
var utils = require('../utils'),
    path = require('path'),
    crypto = require('crypto'),
    fs = require('fs'),
    watchFileName,
    watchFile;

// Attempts to see if fs.watch will work. On some platforms, it doesn't.
// See: http://nodejs.org/api/fs.html#fs_caveats
// Sends the callback true if fs.watch will work, false if it won't
//
// Caveats:
// If there is no writable tmp directory, it will also return true, although
// a warning message will be displayed.
var changeDetected = false;

function check(cb) {
  var tmpdir;

  watchable.cb = cb;
  changeDetected = false;

  if (utils.isWindows) {
    tmpdir = process.env.TEMP;
  } else if (process.env.TMPDIR) {
    tmpdir = process.env.TMPDIR;
  } else {
    tmpdir = '/tmp';
  }

  watchFileName = path.join(tmpdir, 'nodemonCheckFsWatch' + crypto.randomBytes(16).toString('hex'));
  watchFile = fs.openSync(watchFileName, 'w');
  if (watchFile < 0) {
    utils.log.fail('Unable to write to temp directory. If you experience problems with file reloading, ensure ' + tmpdir + ' is writable.');
    cb(true);
    return;
  }
  fs.watch(watchFileName, function() {
    cb(true);
  });

  fs.watchFile(watchFileName, function () {});

  setTimeout(function () {
    // This should trigger fs.watch, if it works
    fs.writeSync(watchFile, '1');

    // higher timeout to allow for windows to trigger the watch event
    setTimeout(finish, 1000);
  }, 250);


}

// Verifies that fs.watch was not triggered and sends false to the callback
// but if the callback has already been used (changeDetected), it won't call.
var finish = function() {
  fs.unlinkSync(watchFileName);
  watchable.cb(false);
};

var watchable = module.exports = function (config, ready) {
  check(function(success) {
    config.system.useWatch = success;
    if (changeDetected) {
      utils.bus.emit('config:update');
    } else {
      changeDetected = true; // prevents the `ready` being called twice
      ready();
    }
  });
};

watchable.check = check;