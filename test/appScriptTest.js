var fs = require('fs');
var spawn = require('child_process').spawn;

var should = require('should');

var logOutput = '';

describe('nodemon', function () {

  describe('when started with no arguments', function () {

    before(function (done) {
      var nodeProcess = spawn('node', ['../../nodemon.js'], { cwd: 'test/fixtures' });
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

    it('should run the server specified in the package.json \'main\' property', function () {
      var packageObject = JSON.parse(fs.readFileSync('./test/fixtures/package.json'));
      logOutput.should.include(packageObject.main);
    });

  });

});
