var rules = require('./rules'),
    monitor = require('./monitor'),
    version = require('./version'),
    utils = require('./utils'),
    help = require('./help');

var nodemon = function (settings) {
  console.log(settings);

  if (settings.options.help) {
    return help(settings.options.help);
  }

  if (settings.options.version) {
    return version();
  }

  monitor.run(settings.options.exec, [settings.userScript].concat(settings.args), settings.options);
}

nodemon.state = {};

nodemon.restart = function () {
  utils.log.status('restarting child process');
  process.emit('nodemon:kill');
};

module.exports = nodemon;