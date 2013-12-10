'use strict';
/*global describe:true, it: true, after: true */
var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    utils = require('../utils'),
    appjs = utils.appjs,
    cleanup = utils.cleanup,
    run = utils.run,
    files = [],
    randomFile = function () {
      return '_nodemon' + (Math.random() * Date.now() | 0);
    };

function ignore(rule, done, file) {
  var p = run((rule ? ('-i ' + rule + ' ') : '') + appjs, {
      // output: function (data) {
      //   console.log(data.trim());
      // },
      error: function (data) {
        p.send('quit');
        cleanup(p, done, new Error(data));
      }
    });

  p.on('message', function (event) {
    if (event.type === 'start') {
      // touch
      setTimeout(function () {
        if (!file) {
          file = path.join(process.cwd(), rule, randomFile());
        }

        files.push(file);
        fs.writeFile(file, function (err) {
          if (err) {
            console.log('error on writing file');
            cleanup(p, done, new Error(err));
          }
        });

        // if this fires, then *nothing* happened, which is good
        setTimeout(function () {
          // assert(true, 'nodemon did not restart');
          cleanup(p, done);
        }, 1000);
      }, 1000);
    } else if (event.type === 'restart') {
      assert(false, 'nodemon should not restart');
      cleanup(p, done);
    }
  });
}

describe('nodemon ignore', function () {
  after(function () {
    files.forEach(fs.unlink);
  });

  it('should be controlled via cli', function (done) {
    ignore('node_modules', done);
  });

  it('should ignore node_modules by default', function (done) {
    ignore(null, done, path.join(process.cwd(), 'node_modules', 'connect', 'node_modules', randomFile()));
  });

});