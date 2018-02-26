const utils = require('../utils');

module.exports = ({ options, config }) => {

  var stdio = ['pipe', 'pipe', 'pipe'];

  if (config.options.stdout) {
    stdio = ['pipe', process.stdout, process.stderr];
  }

  if (config.options.stdin === false) {
    stdio = [process.stdin, process.stdout, process.stderr];
  }

  var sh = 'sh';
  var shFlag = '-c';

  const spawnOptions = {
    env: utils.merge(options.execOptions.env, process.env),
    stdio: stdio,
  }

  if (utils.isWindows) {
    // taken from npm's cli: https://git.io/vNFD4
    sh = process.env.comspec || 'cmd';
    shFlag = '/d /s /c';
    spawnOptions.windowsVerbatimArguments = true;
  }

  var runCmd = !options.runOnChangeOnly || config.lastStarted !== 0;
  var cmd = config.command.raw;
  var executable = cmd.executable;
  var args = runCmd ? utils.stringify(executable, cmd.args) : ':';
  var spawnArgs = [sh, [shFlag, args], spawnOptions];

  return {
    args,
    cmd,
    executable,
    runCmd,
    sh,
    shFlag,
    spawnArgs,
    stdio,
  };
}
