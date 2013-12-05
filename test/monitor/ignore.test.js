/*global describe:true, it: true, after: true */
var assert = require('assert'),
    path = require('path'),
    colour = require('../../lib/utils/colour'),
    fs = require('fs'),
    utils = require('../utils'),
    appjs = utils.appjs,
    match = utils.match,
    cleanup = utils.cleanup,
    run = utils.run,
    files = [],
    randomFile = function () {
      return '_nodemon' + (Math.random() * Date.now() | 0);
    };

function ignore(rule, done) {
  var p = run('-i ' + rule + ' ' + appjs, {
      output: function (data) {
        if (match(data, 'changes after filters')) {
          var changes = colour.strip(data.trim()).slice(-5).split('/');
          var restartedOn = changes.pop();

          assert(restartedOn === '0', 'expects to not have restarted');
          cleanup(p, done);
        }
      },
      error: function (data) {
        p.send('quit');
        cleanup(p, done, new Error(data));
      }
    });

  p.on('message', function (event) {
    if (event.type === 'start') {
      // touch
      setTimeout(function () {
        var file = path.join(process.cwd(), rule, randomFile());
        files.push(file);
        fs.writeFile(file);
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
    ignore('node_modules', done);
  });

});