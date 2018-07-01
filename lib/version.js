'use strict';
module.exports = version;
module.exports.pin = pin;

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
let root = null;

function pin() {
  return version().then(function (v) {
    version.pinned = v;
  });
}

function version(callback) {
  // first find the package.json as this will be our root
  const promise = findPackage(path.dirname(module.parent.filename))
    .then(function (dir) {
      // now try to load the package
      const v = require(path.resolve(dir, 'package.json')).version;

      if (v && v !== '0.0.0-development') {
        return v;
      }

      root = dir;

      // else we're in development, give the commit out
      // get the last commit and whether the working dir is dirty
      const promises = [
        branch().catch(function () { return 'master'; }),
        commit().catch(function () { return '<none>'; }),
        dirty().catch(function () { return 0; }),
      ];

      // use the cached result as the export
      return Promise.all(promises).then(function (res) {
        const branch = res[0];
        const commit = res[1];
        const dirtyCount = parseInt(res[2], 10);
        let curr = branch + ': ' + commit;

        if (dirtyCount !== 0) {
          curr += ' (' + dirtyCount + ' dirty files)';
        }

        return curr;
      });
    }).catch(function (error) {
      console.log(error.stack);
      throw error;
    });

  if (callback) {
    promise.then(function (res) {
      callback(null, res);
    }, callback);
  }

  return promise;
}

function findPackage(dir) {
  if (dir === '/') {
    return Promise.reject(new Error('package not found'));
  }
  return new Promise(function (resolve) {
    fs.stat(path.resolve(dir, 'package.json'), function (error, exists) {
      if (error || !exists) {
        return resolve(findPackage(path.resolve(dir, '..')));
      }

      resolve(dir);
    });
  });
}

function command(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, { cwd: root }, function (err, stdout, stderr) {
      const error = stderr.trim();

      if (error) {
        return reject(new Error(error));
      }
      resolve(stdout.split('\n').join(''));
    });
  });
}

function commit() {
  return command('git rev-parse HEAD');
}

function branch() {
  return command('git rev-parse --abbrev-ref HEAD');
}

function dirty() {
  return command('expr $(git status --porcelain 2>/dev/null| ' +
    'egrep "^(M| M)" | wc -l)');
}
