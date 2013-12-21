var fs = require('fs');
var spawn = require('child_process').spawn;

var should = require('should');

var logOutput = '';
var serverLocation = 'test/fixtures/livescript/server.ls';

describe('nodemon', function () {

  describe('when run on a .ls file', function () {

    before(function (done) {
      var nodeProcess = spawn('node', ['nodemon.js', serverLocation]);
      var doneLogging = false;

      nodeProcess.stdout.setEncoding('utf8');
      nodeProcess.stdout.on('data', function (data) {
        logOutput += data;
        if (data.match(/^Listening on port 8000*/)) {
          nodeProcess.kill();
          done();
        }
      });
    });

    it('should use the `lsc` command to start the server', function () {
      logOutput.should.include('starting `lsc '+ serverLocation + '`');
    });

  });

});
