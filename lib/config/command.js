'use strict';

module.exports = command;

function command(settings) {
  var options = settings.execOptions;
  var executable = options.exec,
      args = [];

  // after "executable" go the exec args (like --debug, etc)
  if (options.execArgs) {
    [].push.apply(args, options.execArgs);
  }

  // then goes the user's script arguments
  if (options.args) {
    [].push.apply(args, options.args);
  }

  // after the "executable" goes the user's script
  if (options.script) {
    args.splice((options.scriptPosition || 0) + options.execArgs.length, 0, options.script);
  }

  return {
    executable: executable,
    args: args
  };
}