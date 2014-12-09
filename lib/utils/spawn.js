var config = require('../config'),
    childProcess = require('child_process'),
    nodeMajor = parseInt((process.versions.node.split('.') || [null,null])[1] || 0, 10),
    spawn = childProcess.spawn,

function spawn(command) {
  var stdio = ['pipe', 'pipe', 'pipe'];

  if (config.options.stdout) {
    stdio = ['pipe', process.stdout, process.stderr];
  }

  if (nodeMajor >= 8) {
    child = spawn(cmd.executable, cmd.args, {
      env: utils.merge(options.execOptions.env, process.env),
      stdio: stdio
    });
  } else {
    child = spawn(cmd.executable, cmd.args);
  }

  if (config.required) {
    var emit = {
      stdout: function (data) {
        bus.emit('stdout', data);
      },
      stderr: function (data) {
        bus.emit('stderr', data);
      }
    };

    // now work out what to bind to...
    if (config.options.stdout) {
      child.on('stdout', emit.stdout).on('stderr', emit.stderr);
    } else {
      child.stdout.on('data', emit.stdout);
      child.stderr.on('data', emit.stderr);

      bus.stdout = child.stdout;
      bus.stderr = child.stderr;
    }
  }
}