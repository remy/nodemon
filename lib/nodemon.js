var rules = require('./rules'),
    monitor = require('./monitor'),
    version = require('./version'),
    utils = require('./utils'),
    help = require('./help'),
    rules = require('./rules'),
    path = require('path');

var nodemon = function (settings) {
  if (settings.options.help) {
    return help(settings.options.help);
  }

  if (settings.options.version) {
    version();
    process.exit(0);
  }

  var config = require('./config');


  // convert ignore and watch options to rules/regexp
  rules.watch.add(settings.options.watch);
  rules.ignore.add(settings.options.ignore);

  settings.options.watch = rules.rules.watch;
  settings.options.ignore = rules.rules.ignore;

  // read directories to monitor
  if (settings.options.watch && settings.options.watch.length > 0) {
    settings.options.watch.forEach(function (dir) {
      config.dirs.push(path.resolve(dir));
    });
  } else {
    config.dirs.unshift(process.cwd());
  }

  // on exception *inside* nodemon, shutdown wrapped node app
  process.on('uncaughtException', function (err) {
    utils.log.error('exception in nodemon killing node');
    utils.log.error(err.stack);
    process.exit(1);
  });

  config.init(function () {
    config.options = settings.options;

    monitor.run(settings.options.exec, [settings.userScript].concat(settings.args), settings.options);
  });
}

nodemon.state = {};

nodemon.restart = function () {
  utils.log.status('restarting child process');
  process.emit('nodemon:kill');
};

module.exports = nodemon;