'use strict';
var fs = require('fs'),
    path = require('path'),
    changedSince = require('./changed-since'),
    utils = require('../utils'),
    bus = utils.bus,
    match = require('./match'),
    config = require('../config'),
    childProcess = require('child_process'),
    exec = childProcess.exec,
    restartTimer = null,
    watched = [],
    watchers = [];

var changeFunction = function () {
  utils.log.error('changeFunction called when it shouldn\'t be.');
};

bus.on('config:update', function () {
  if (config.system.noWatch) {
    // if native fs.watch doesn't work the way we want, we keep polling find
    // command (mac only oddly)
    changeFunction = function (lastStarted, callback) {
      var cmds = [];

      config.dirs.forEach(function(dir) {
        cmds.push('find -L "' + dir + '" -type f -mtime -' + ((Date.now() - config.lastStarted)/1000|0) + 's -print');
      });

      exec(cmds.join(';'), function (error, stdout) {
        var files = stdout.split(/\n/);
        files.pop(); // remove blank line ending and split
        callback(files);
      });
    };
  } else if (config.system.watchWorks) {
    bus.once('quit', function () {
      // manually remove all the file watchers
      // note that fs.unwatchFile doesn't really work, particularly in vagrant
      // shared folders and in Travis CI, so I've not b
      while (watchers.length) {
        watchers.pop().removeAllListeners('change');
      }

      // reset the watched directory too
      watched.length = 0;
    });

    var watchFile = config.options.forceLegacyWatch,
        watchMethod = watchFile ? 'watchFile' : 'watch';

    changeFunction = function (lastStarted, callback) {
      // recursive watch - watch each directory and it's subdirectories, etc, etc
      function watch(err, dir) {
        try {
          if (watched.indexOf(dir) === -1 && ignoredFilter(dir)) {
            var watcher = fs[watchMethod](dir, { persistent: false }, function (event, filename) {

              var filepath;

              if (filename instanceof String) {
                filepath = path.join(dir, filename || '');
              } else { // was called from watchFile
                filepath = dir;
              }

              callback([filepath]);
            });
            watched.push(dir);
            watchers.push(watcher);
          }

          fs.readdir(dir, function (err, files) {
            if (err) { return; }

            files.forEach(function (rawfile) {
              var file = path.join(dir, rawfile);
              if (watched.indexOf(file) === -1) {
                fs.stat(file, function (err, stat) {
                  if (err || !stat) { return; }

                  // if we're using fs.watch, then watch directories
                  if (!watchFile && stat.isDirectory()) {
                    // recursive call to watch()
                    fs.realpath(file, watch);
                  } else {
                    // if we're in legacy mode, i.e. Vagrant + editing over
                    // shared drive, then watch the individual file
                    if (watchFile) {
                      fs.realpath(file, watch);
                    }

                    if (ignoredFilter(file)) {
                      watched.push(file);
                    }
                  }
                });
              }
            });
          });
        } catch (e) {
          if ('EMFILE' === e.code) {
            utils.log.error('EMFILE: Watching too many files.');
          }
          // ignoring this directory, likely it's "My Music"
          // or some such windows fangled stuff
        }
      }

      config.dirs.forEach(function (dir) {
        fs.realpath(dir, watch);
      });
    };
  } else {
    // changedSince, the fallback for when both the find method and fs.watch
    // don't work, is not compatible with the way changeFunction works. If we
    // have reached this point, changeFunction should not be called from herein
    // out.
  }
});

// filter ignored files
function ignoredFilter(file) {
  if (config.options.ignore.length && config.options.ignore.re) {
    // If we are in a Windows machine
    if (utils.isWindows) {
      // Break up the file by slashes
      var fileParts = file.split(/\\/g);

      // Remove the first piece (C:)
      fileParts.shift();

      // Join the parts together with Unix slashes
      file = '/' + fileParts.join('/');
    }

    return !config.options.ignore.re.test(file);
  } else {
    return true;
  }
}

function filterAndRestart(files) {
  if (files.length) {
    var cwd = process.cwd();
    utils.log.detail('files triggering change check: ' + files.map(function (file) {
      return path.relative(cwd, file);
    }).join(', '));

    if (!config.options.execOptions) {
      console.log(config);
    }
    var matched = match(files, config.options.monitor, config.options.execOptions.ext);

    utils.log.detail('changes after filters (before/after): ' + [files.length, matched.result.length].join('/'));

    // reset the last check so we're only looking at recently modified files
    config.lastStarted = Date.now();

    if (matched.result.length) {
      if (restartTimer !== null) {
        clearTimeout(restartTimer);
      }
      restartTimer = setTimeout(function () {
        utils.log.status('restarting due to changes...');
        matched.result.forEach(function (file) {
          utils.log.detail(path.relative(process.cwd(), file));
        });
        if (config.options.verbose) {
          utils.log._log('');
        }

        bus.emit('restart');

      }, config.options.delay);
      return;
    }
  }

  if (config.system.noWatch || config.options.forceLegacyWatch) {
    if (config.run) {
      setTimeout(watch, config.timeout);
    }
  }
}

var watch = module.exports = function () {
  // if we have noWatch or watchWorks (i.e. not using `find`)
  // then called `changeFunction` which is local to this script
  if ((config.system.noWatch || config.system.watchWorks) && !config.options.forceLegacyWatch) {
    changeFunction(config.lastStarted, function (files) {
      if (config.run) {
        filterAndRestart(files);
      }
    });
  } else {
    // Fallback for when both find and fs.watch don't work
    // using the `changedSince` which is external
    changedSince(config.lastStarted, function (files) {
      if (config.run) {
        filterAndRestart(files);
      }
    });
  }
};