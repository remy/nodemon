var changedSince = require('./changed-since'),
    utils = require('../utils'),
    config = require('../config'),
    restartTimer = null;

var monitor = module.exports = function () {
  var changeFunction;

  if (config.noWatch) {
    // if native fs.watch doesn't work the way we want, we keep polling find
    // command (mac only oddly)
    changeFunction = function (lastStarted, callback) {
      var cmds = [],
          changed = [];

      dirs.forEach(function(dir) {
        cmds.push('find -L "' + dir + '" -type f -mtime -' + ((Date.now() - config.lastStarted)/1000|0) + 's -print');
      });

      exec(cmds.join(';'), function (error, stdout, stderr) {
        var files = stdout.split(/\n/);
        files.pop(); // remove blank line ending and split
        callback(files);
      });
    };
  } else if (config.watchWorks) {
    changeFunction = function (lastStarted, callback) {
      // recursive watch - watch each directory and it's subdirectories, etc, etc
      function watch(err, dir) {
        try {
          fs.watch(dir, { persistent: false }, function (event, filename) {
            var filepath = path.join(dir, filename || '');
            callback([filepath]);
          });

          fs.readdir(dir, function (err, files) {
            if (!err) {
              files.forEach(function (rawfile) {
                var file = path.join(dir, rawfile);
                if (-1 === watched.indexOf(file)) {
                  fs.stat(file, function (err, stat) {
                    if (!err && stat) {
                      if (stat.isDirectory()) {
                        fs.realpath(file, watch);
                      } else {
                        if (ignoredFilter(file)) {
                          watched.push(file);
                        }
                      }
                    }
                  });
                }
              });
            }
          });
        } catch (e) {
          if ('EMFILE' === e.code) {
            console.error('EMFILE: Watching too many files.');
          }
          // ignoring this directory, likely it's "My Music"
          // or some such windows fangled stuff
        }
      }

      dirs.forEach(function (dir) {
        fs.realpath(dir, watch);
      });
    };
  } else {
    // changedSince, the fallback for when both the find method and fs.watch
    // don't work, is not compatible with the way changeFunction works. If we
    // have reached this point, changeFunction should not be called from herein
    // out.
    changeFunction = function() {
      utils.log.error('changeFunction called when it shouldn\'t be.');
    };
  }

  // filter ignored files
  var ignoredFilter = function (file) {
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
  };

  if ((config.noWatch || config.watchWorks) && !config.options.forceLegacyWatch) {
    changeFunction(config.lastStarted, function (files) {
      if (files.length) {
        files = files.filter(ignoredFilter);
        if (files.length) {
          if (restartTimer !== null) {
            clearTimeout(restartTimer);
          }

          // FIXME this entire block seems to be duplicated
          restartTimer = setTimeout(function () {
            if (config.options.verbose) {
              util.log.status('restarting due to changes...');
            }
            files.forEach(function (file) {
              if (config.options.verbose) {
                util.log.info(file);
              }
            });
            if (config.options.verbose) {
              console.log('\n\n');
            }

            process.emit('nodemon:kill');

          }, config.options.delay);
          return;
        }
      }

      if (config.noWatch) { setTimeout(monitor, timeout); }
    });
  } else {
    // Fallback for when both find and fs.watch don't work
    changedSince(config.lastStarted, function (files) {
      if (files.length) {
        // filter ignored files
        if (config.options.ignore.length) {
          files = files.filter(function(file) {
            return !config.options.ignore.re.test(file);
          });
        }

        if (files.length) {
          if (restartTimer !== null) {
            clearTimeout(restartTimer);
          }
          restartTimer = setTimeout(function () {
            if (config.options.verbose) {
              utils.log.status('restarting due to changes...');
            }
            files.forEach(function (file) {
              if (config.options.verbose) {
                utils.log.info(file);
              }
            });
            if (config.options.verbose) {
              console.log('\n\n');
            }

            process.emit('nodemon:kill');

          }, config.options.delay);
          return;
        }
      }

      setTimeout(monitor, config.timeout);
    });
  }
}