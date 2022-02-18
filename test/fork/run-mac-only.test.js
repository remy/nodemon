const fs = require('fs');
const assert = require('assert');
const utils = require('../utils');
const appJS = utils.appjs;
const run = utils.run;

const filenames = [
  [__dirname + 'some\\\"file', '#!/usr/bin/env node\nconsole.log("OK");'],
  [__dirname + 'some\ \\file', '#!/bin/sh\necho "OK"'],
];

if (false && !process.env.TRAVIS && process.platform === 'darwin') {
  describe('nodemon fork (mac only)', () => {
    before(() => {
      filenames.map(file => fs.writeFileSync(file[0], file[1], 'utf8'));
    });

    after(() => {
      filenames.map(file => fs.unlinkSync(file[0]));
    });

    it('should start a fork exec with quotes and escaping', done => {
      let found = false;
      var p = run({
        exec: 'bin/nodemon.js',
        // make nodemon verbose so we can check the filters being applied
        args: ['-q', '--exec', filenames[0][0]]
      }, {
          error: function (data) {
            p.send('quit');
            done(new Error(data));
          },
          output: function (data) {
            // process.stdout.write(data);
            if (data.trim() === 'OK') {
              found = true;
            }
          }
        });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            p.send('quit');
            done();
            assert(found, '"OK" message was found');
          }, 500);
        }
      });
    });

    it('should start a fork exec with spaces and slashes', done => {
      let found = false;
      var p = run({
        exec: 'bin/nodemon.js',
        // make nodemon verbose so we can check the filters being applied
        args: ['-q', '--exec', `"${filenames[1][0]}`]
      }, {
          error: function (data) {
            p.send('quit');
            done(new Error(data));
          },
          output: function (data) {
            // process.stdout.write(data);
            if (data.trim() === 'OK') {
              found = true;
            }
          }
        });

      p.on('message', function (event) {
        if (event.type === 'start') {
          setTimeout(function () {
            p.send('quit');
            done();
            assert(found, '"OK" message was found');
          }, 500);
        }
      });
    });
  });
}
