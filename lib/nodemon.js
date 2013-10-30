var monitor = require('./monitor'),
    version = require('./version'),
    utils = require('./utils'),
    help = require('./help'),
    path = require('path'),
    config = require('./config');

var nodemon = function (settings) {
  if (settings.help) {
    return help(settings.help);
  }

  if (settings.version) {
    console.log(version);
    process.exit(0);
  }

  // on exception *inside* nodemon, shutdown wrapped node app
  process.on('uncaughtException', function (err) {
    utils.log.error('exception in nodemon killing node');
    utils.log.error(err.stack);
    process.exit(1);
  });

  utils.log.info(version);

  config.load(settings, function (config) {
    if (config.options.restartable) {
      utils.log.info('to restart at any time, enter `' + settings.restartable + '`');
    }
    config.dirs.forEach(function (dir) {
      utils.log.info('watching: ' + dir);
    });

    utils.log.detail('watching extensions: ' + config.options.ext);

    config.options.ignore.forEach(function (pattern) {
      utils.log.detail('ignoring: ' + pattern);
    });

    monitor.run(config.options);
  });
}

// nodemon.state = {};

nodemon.restart = function () {
  utils.log.status('restarting child process');
  process.emit('nodemon:kill');
};

module.exports = nodemon;