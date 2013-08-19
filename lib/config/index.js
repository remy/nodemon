var fs = require('fs'),
    util = require('util'),
    childProcess = require('child_process'),
    exec = childProcess.exec,
    isWindows = process.platform === 'win32',
    noWatch = (process.platform !== 'win32') || !fs.watch,
    // whether or not fs.watch actually works on this platform, tested and set later before starting
    watchWorks = true,
    settings = {};


// Attempts to see if fs.watch will work. On some platforms, it doesn't.
// See: http://nodejs.org/api/fs.html#fs_caveats
// Sends the callback true if fs.watch will work, false if it won't
//
// Caveats:
// If there is no writable tmp directory, it will also return true, although
// a warning message will be displayed.
//
var watchFileChecker = {};
watchFileChecker.check = function(cb) {
  var tmpdir,
      seperator = '/';

  this.cb = cb;
  this.changeDetected = false;
  if (isWindows) {
    seperator = '\\';
    tmpdir = process.env.TEMP;
  } else if (process.env.TMPDIR) {
    tmpdir = process.env.TMPDIR;
  } else {
    tmpdir = '/tmp';
  }
  var watchFileName = tmpdir + seperator + 'nodemonCheckFsWatch' + Date.now();
  var watchFile = fs.openSync(watchFileName, 'w');
  if (!watchFile) {
    util.log('\x1B[32m[nodemon] Unable to write to temp directory. If you experience problems with file reloading, ensure ' + tmpdir + ' is writable.\x1B[0m');
    cb(true);
    return;
  }
  fs.watch(watchFileName, function() {
    if (watchFileChecker.changeDetected) { return; }
    watchFileChecker.changeDetected = true;
    cb(true);
  });
  // This should trigger fs.watch, if it works
  fs.writeSync(watchFile, '1');
  fs.unlinkSync(watchFileName);

  setTimeout(function() { watchFileChecker.verify(); }, 250);
};

// Verifies that fs.watch was not triggered and sends false to the callback
watchFileChecker.verify = function() {
  if (!this.changeDetected) {
    this.cb(false);
  }
};

// test to see if the version of find being run supports searching by seconds (-mtime -1s -print)
function canMonitor(callback) {
  var ready = function () {
    watchFileChecker.check(function(success) {
      watchWorks = success;
      callback();
    });
  };

  if (noWatch) {
    exec('find -L /dev/null -type f -mtime -1s -print', function(error) {
      if (error) {
        if (!fs.watch) {
          util.error('\x1B[1;31mThe version of node you are using combined with the version of find being used does not support watching files. Upgrade to a newer version of node, or install a version of find that supports search by seconds.\x1B[0m');
          process.exit(1);
        } else {
          noWatch = false;
          ready();
        }
      } else {
        // Find is compatible with -1s
        callback();
      }
    });
  } else {
    ready();
  }
}

module.exports = {
  canMonitor: canMonitor,
  readConfig: function () {},
  settings: settings
};