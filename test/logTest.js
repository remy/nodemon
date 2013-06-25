var fs = require('fs');
var spawn = require('child_process').spawn;

var should = require('should');

var logOutput = '';
var serverLocation = 'test/fixtures/server/index.js';

describe('nodemon', function () {

  describe('when started', function () {

    before(function (done) {
      var nodeProcess = spawn('node', ['nodemon.js', serverLocation]);
      var doneLogging = false;

      nodeProcess.stdout.setEncoding('utf8');
      nodeProcess.stdout.on('data', function (data) {
        logOutput += data;
        if (data.match(/^Running server.*/)) {
          nodeProcess.kill();
          done();
        }
      });
    });

    it('should log what it is watching', function () {
      logOutput.should.include(__dirname.slice(0, -('/test'.length)));
    });

    it('should log the restart instructions', function () {
      logOutput.should.include('to restart at any time, enter `rs`');
    });

    it('should log the nodemon version number', function () {
      var packageObject = JSON.parse(fs.readFileSync('package.json'));
      logOutput.should.include(packageObject.version);
    });

    it('should log the server starting', function () {
      logOutput.should.include('starting `node ' + serverLocation + '`');
    });

  });

});
