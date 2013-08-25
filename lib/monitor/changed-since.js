var fs = require('fs'),
    utils = require('../utils'),
    config = require('../config'),
    path = require('path');

module.exports = changedSince;

// This is a fallback function is only used if fs.watch does not work
function changedSince(time, dir, callback) {
  if (!callback) {
    callback = dir;
  }

  var changed = [],
      todo = 0,
      done = function () { // why you no use async, remy? – Remy
        todo--;
        if (todo === 0) {
          callback(changed);
        }
      };

  dir = dir && typeof dir !== 'function' ? [dir] : config.dirs;

  dir.forEach(function (dir) {
    todo++;
    fs.readdir(dir, function (err, files) {
      if (err) {
        return;
      }

      files.forEach(function (file) {
        if (config.options.includeHidden === true || !config.options.includeHidden && file.indexOf('.') !== 0) {
          todo++;
          file = path.resolve(dir + '/' + file);
          fs.stat(file, function (err, stat) {
            if (stat) {
              if (stat.isDirectory()) {
                todo++;
                changedSince(time, file, function (subChanged) {
                  if (subChanged.length) {
                    changed = changed.concat(subChanged);
                  }
                  done();
                });
              } else if (stat.mtime > time) {
                changed.push(file);
              }
            }
            done();
          });
        }
      });
      done();
    });
  });
}