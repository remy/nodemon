'use strict';
/*global describe:true, it: true, after: true */
var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    utils = require('../../utils'),
    appjs = utils.appjs,
    cleanup = utils.cleanup,
    run = utils.run,
    files = [],
    randomFile = function () {
      return '_nodemon' + (Math.random() * Date.now() | 0);
    };

describe('nodemon ignore', function () {
  var proc;

  function ignore(rule, done, file) {
    proc = run((rule ? ('-i ' + rule + ' ') : '') + appjs, {
      output: function (data) {
        assert(true, data.trim());
      },
      error: function (data) {
        new Error(data);
      },
    });

    proc.on('message', function (event) {
      if (event.type === 'start') {
        // touch
        setTimeout(function () {
          if (!file) {
            file = path.join(process.cwd(), rule, randomFile());
          }

          files.push(file);
          fs.writeFile(file, function (err) {
            if (err) {
              assert(false, 'error on writing file')
              new Error(err);
            }
          });

          // if this fires, then *nothing* happened, which is good
          setTimeout(function () {
            assert(true, 'nodemon did not restart');
            done();
          }, 1000);
        }, 1000);
      } else if (event.type === 'restart') {
        assert(false, 'nodemon should not restart');
        done();
      }
    });
  }

  afterEach(function(done) {
    if (typeof proc === 'undefined') {
      done();
      return;
    }

    cleanup(proc, done);
    proc = undefined;
  });

  it('should be controlled via cli', function (done) {
    this.timeout(5000);

    ignore('node_modules', done);
  });

  it('should ignore node_modules by default', function (done) {
    this.timeout(5000);

    var nodeModules = path.join(
      process.cwd(),
      'node_modules', 'connect', 'node_modules',
      randomFile()
    );

    ignore(null, done, nodeModules);
  });

});
