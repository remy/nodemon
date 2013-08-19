var utils = require('../utils'),
    exec = require('child_process').exec;


function killNode() {
  if (child !== null) {
    // When using CoffeeScript under Windows, child's process is not node.exe
    // Instead coffee.cmd is launched, which launches cmd.exe, which starts
    // node.exe as a child process child.kill() would only kill cmd.exe, not
    // node.exe
    // Therefore we use the Windows taskkill utility to kill the process and all
    // its children (/T for tree)
    if (utils.isWindows) {
      // For the on('exit', ...) handler above the following looks like a crash,
      // so we set the killedAfterChange flag
      killedAfterChange = true;
      // Force kill (/F) the whole child tree (/T) by PID (/PID 123)
      exec('taskkill /pid '+child.pid+' /T /F');
    } else {
      process.emit('kill', 'SIGUSR2')
      // child.kill('SIGUSR2');
    }
  } else {
    process.emit('startNode');
  }
}

process.on('killNode', killNode);

module.exports = killNode;