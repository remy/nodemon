'use strict';
var fs = require('fs'),
    path = require('path'),
    changedSince = require('./changed-since'),
    utils = require('../utils'),
    bus = utils.bus,
    config = require('../config'),
    childProcess = require('child_process'),
    exec = childProcess.exec,
    restartTimer = null,
    watched = [];

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
    changeFunction = function (lastStarted, callback) {
      // recursive watch - watch each directory and it's subdirectories, etc, etc
      function watch(err, dir) {
        try {
          if (watched.indexOf(dir) === -1 && ignoredFilter(dir)) {
            fs.watch(dir, { persistent: false }, function (event, filename) {
              var filepath = path.join(dir, filename || '');
              callback([filepath]);
            });
            watched.push(dir);
          }

          fs.readdir(dir, function (err, files) {
            if (err) { return; }

            files.forEach(function (rawfile) {
              var file = path.join(dir, rawfile);
              if (watched.indexOf(file) === -1) {
                fs.stat(file, function (err, stat) {
                  if (err || !stat) { return; }

                  if (stat.isDirectory()) {
                    // recursive call to watch()
                    fs.realpath(file, watch);
                  } else {
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
  if (config.options.ignore.length) {
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
  var data = {};
  if (files.length) {
    data.all = files.length;
    utils.log.detail('files trigggering change check: ' + files.join('\n'));

    files = files.filter(ignoredFilter);

    data.ignore = files.length;

    if (config.options.watch.length) {
      files = files.filter(function (file) {
        return config.options.watch.re.test(file);
      });
    }

    data.watch = files.length;

    utils.log.detail('changes after filters (pre/ignored/valid): ' + [data.all, data.ignore, data.watch].join('/'));

    // reset the last check so we're only looking at recently modified files
    config.lastStarted = Date.now();

    if (files.length) {
      if (restartTimer !== null) {
        clearTimeout(restartTimer);
      }
      restartTimer = setTimeout(function () {
        utils.log.status('restarting due to changes...');
        files.forEach(function (file) {
          utils.log.detail(path.relative(process.cwd(), file));
        });
        if (config.options.verbose) {
          console.log();
        }

        bus.emit('restart');

      }, config.options.delay);
      return;
    }
  }

  if (config.system.noWatch || config.options.forceLegacyWatch) {
    setTimeout(monitor, config.timeout);
  }
}

var monitor = module.exports = function () {
  // if we have noWatch or watchWorks (i.e. not using `find`)
  // then called `changeFunction` which is local to this script
  if ((config.system.noWatch || config.system.watchWorks) && !config.options.forceLegacyWatch) {
    changeFunction(config.lastStarted, function (files) {
      filterAndRestart(files);
    });
  } else {
    // Fallback for when both find and fs.watch don't work
    // using the `changedSince` which is external
    changedSince(config.lastStarted, function (files) {
      filterAndRestart(files);
    });
  }
};