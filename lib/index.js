var rules = require('./rules'),
    monitor = require('./monitor'),
    version = require('./version'),
    utils = require('./utils'),
    help = require('./help');

module.exports = nodemon;

function nodemon(settings) {
  console.log(settings);

  if (settings.options.help) {
    return help(settings.options.help);
  }

  if (settings.options.version) {
    return version();
  }

  monitor.run(settings.options.exec, [settings.userScript].concat(settings.args), settings.options);
}

// allow nodemon to restart when the use types 'rs\n'
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
  data = (data + '').trim().toLowerCase();
  if (data === 'rs') {
    utils.status('restarting child process');
    process.emit('killNode');
  }
});
