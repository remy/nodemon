var fs = require('fs'),
    path = require('path');

// This is a fallback function if fs.watch does not work
function changedSince(time, dir, callback) {
  if (!callback) {
    callback = dir;
  }

  var changed = [],
      todo = 0,
      done = function () {
        todo--;
        if (todo === 0) {
          callback(changed);
        }
      };

  dir = dir && typeof dir !== 'function' ? [dir] : dirs;

  dir.forEach(function (dir) {
    todo++;
    fs.readdir(dir, function (err, files) {
      if (err) {
        return;
      }

      files.forEach(function (file) {
        if (program.includeHidden === true || !program.includeHidden && file.indexOf('.') !== 0) {
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


module.exports = {
  changedSince: changedSince
};