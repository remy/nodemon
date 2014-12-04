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

function reset() {
  // manually remove all the file watchers.
  // note that fs.unwatchFile doesn't really work, particularly in vagrant
  // shared folders and in Travis CI...
  var watcher;
  while (watchers.length) {
    watcher = watchers.pop();
    watcher.removeAllListeners('change');
    watcher.close();
  }

  // reset the watched directory too
  watched.length = 0;
}

function showWatchCount() {
  var cmds = [];
  config.dirs.forEach(function(dir) {
    cmds.push('find -L "' + dir + '" -type f ' + ignoredFileTypesForFind(dir) + ' | wc');
  });

  exec(cmds.join(';'), function (error, stdout) {
    if (!config.run) {
      return; // we're too late
    }

    var total = 0;
    stdout.split(/\n/).map(function (line) {
      total += (line.trim().split(/\s+/)[0]||0) * 1;
    });

    utils.log.detail('watching ' + (total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' files');

    if (total > 25000) {
      utils.log.fail('watching ' + (total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' files - this might cause high cpu usage. To reduce use "--watch".');
    }
  });
}

bus.on('config:update', function () {
  reset();

  if (config.system.useFind) {
    // let's do a sanity check for the amount of files we'll be watching for...
    showWatchCount();

    // if native fs.watch doesn't work the way we want, we keep polling find
    // command (mac only oddly)
    changeFunction = function (lastStarted, callback) {
      var cmds = [];

      config.dirs.forEach(function(dir) {
        cmds.push('find -L "' + dir + '" -type f ' + ignoredFileTypesForFind(dir) + ' -mtime -' + ((Date.now() - config.lastStarted)/1000|0) + 's -print');
      });

      exec(cmds.join(';'), function (error, stdout) {
        var files = stdout.split(/\n/);
        files.pop(); // remove blank line ending and split
        callback(files);
      });
    };
  } else if (config.system.useWatch || config.system.useWatchFile) {
    bus.once('quit', reset);

    var watchFile = config.system.useWatch === false && (config.system.useWatchFile || config.options.legacyWatch),
        watchMethod = watchFile ? 'watchFile' : 'watch';
    changeFunction = function (lastStarted, callback) {
      // recursive watch - watch each directory and it's subdirectories, etc, etc
      function watch(err, dir) {
        try {
          if (watched.indexOf(dir) === -1 && ignoredFilter(dir)) {
            var watcher = fs[watchMethod](dir, { persistent: false }, function (event, filename) {

              var filepath;

              if (typeof filename === 'string') {
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
              if (watched.indexOf(file) === -1 && ignoredFilter(file)) {
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
                    } else if (ignoredFilter(file)) {
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

      showWatchCount();

      config.dirs.forEach(function (dir) {
        fs.realpath(dir, watch);
      });
    };
  } else {
    // changedSince, the fallback for when both the find method and fs.watch
    // don't work, is not compatible with the way changeFunction works. If we
    // have reached this point, changeFunction should not be called from herein
    // out.
    utils.log.error('No clean method to watch files with - please report\nto http://github.com/remy/nodemon/issues/new with `nodemon --dump`');
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

function ignoredFileTypesForFind(dir) {
  // search within dir for ignored files and paths
  if (!config.options.ignore.length) {
    return '';
  }
  var paths = [];
  if (dir.charAt(dir.length - 1) != '/') {
    dir += '/';
  }
  config.options.ignore.forEach(function (path) {
    var pathIsDir = (path.charAt(path.length - 1) == '/');
    if (pathIsDir) {
      paths.push('! -ipath "' + dir + path + '*"');
    }
    paths.push('! -ipath "' + dir + path + '"');
  });
  return ' \\( ' + paths.join(' -and ') + ' \\)';
}

function filterAndRestart(files) {
  if (files.length) {
    if (utils.isWindows) {
      // ensure the drive letter is in uppercase (c:\foo -> C:\foo)
      files = files.map(function (f) {
        return f[0].toUpperCase() + f.slice(1);
      });
    }

    var cwd = process.cwd();
    utils.log.detail('files triggering change check: ' + files.map(function (file) {
      return path.relative(cwd, file);
    }).join(', '));

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
        matched.result.map(function (file) {
          utils.log.detail(path.relative(process.cwd(), file));
        });

        if (config.options.verbose) {
          utils.log._log('');
        }

        bus.emit('restart', matched.result);

      }, config.options.delay);
      return;
    }
  }

  if (config.system.useFind || config.options.legacyWatch) {
    if (config.run) {
      setTimeout(watch, config.timeout);
    }
  }
}

var watch = module.exports = function () {
  // if we have useFind or useWatch (i.e. not using `find`)
  // then called `changeFunction` which is local to this script
  if ((config.system.useFind || config.system.useWatch || config.system.useWatchFile) && !config.options.legacyWatch) {
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
