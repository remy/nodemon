'use strict';

module.exports = command;

function command(options) {
  var executable = options.execOptions.exec,
      args = [];

  // after "executable" go the exec args (like --debug, etc)
  if (options.execOptions.execArgs) {
    [].push.apply(args, options.execOptions.execArgs);
  }

  // then goes the user's script arguments
  if (options.args) {
    [].push.apply(args, options.args);
  }

  // after the "executable" goes the user's script
  if (options.script) {
    args.splice((options.scriptPosition || 0) + options.execOptions.execArgs.length, 0, options.script);
  }

  return {
    executable: executable,
    args: args
  };
}