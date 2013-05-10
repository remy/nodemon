var should = require('should');
var fs = require('fs');
var spawn = require('child_process').spawn;
var logOutput;
var serverLocation = 'test/fixtures/server/index.js';

describe('When nodemon is run', function () {

  before(function (done) {
    var nodeProcess = spawn('node', ['nodemon.js', serverLocation]);
    var linesOfOutput = 0;
    var doneLogging = false;

    nodeProcess.stdout.setEncoding('utf8');
    nodeProcess.stdout.on('data', function (data) {
      logOutput += data;
      if (data.indexOf('\n') !== -1) {
        linesOfOutput++;
      }
      if (linesOfOutput === 3 && !doneLogging) {
        doneLogging = true;
        nodeProcess.kill();
        done();
      }
    });
  });

  it('logs what it is watching', function () {
    logOutput.should.include(__dirname.slice(0, -('/test'.length)));
  });

  it('logs the restart instructions', function () {
    logOutput.should.include('to restart at any time, enter `rs`');
  });

  it('logs the nodemon version number', function () {
    var packageObject = JSON.parse(fs.readFileSync('package.json'));
    logOutput.should.include(packageObject.version);
  });

  it('logs the server starting', function () {
    logOutput.should.include('starting `node ' + serverLocation + '`');
  });

});
