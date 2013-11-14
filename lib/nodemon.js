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

  // always echo out the current version
  utils.log.info(version);

  config.load(settings, function (config) {
    // echo out notices about running state

    if (config.options.restartable) {
      // allow nodemon to restart when the use types 'rs\n'
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', function (data) {
        data = (data + '').trim().toLowerCase();
        if (data === config.options.restartable) {
          // nodemon.restart();
          process.emit('nodemon:kill');
        }
      });
    } else {
      // if 'restartable' is disabled (via a nodemon.json)
      // then it's possible we're being used with a REPL
      // so let's make sure we don't eat the key presses
      // but also, since we're wrapping, watch out for
      // special keys, like ctrl+c x 2 or '.exit' or ctrl+d
      var ctrlC = false,
          buffer = '';
      process.stdin.on('data', function (data) {
        buffer += data;
        var chr = data.charCodeAt(0);
        if (chr === 3) {
          if (ctrlC) {
            process.exit();
          }
          ctrlC = true;
        } else if (buffer === '.exit' || chr === 4) {
          process.exit();
        } else if (ctrlC || chr === 10) {
          ctrlC = false;
          buffer = '';
        }
      });
      process.stdin.setRawMode(true);
    }

    if (config.options.restartable) {
      utils.log.info('to restart at any time, enter `' + config.options.restartable + '`');
    }

    config.dirs.forEach(function (dir) {
      utils.log.info('watching: ' + dir);
    });

    utils.log.detail('watching extensions: ' + config.options.ext);

    config.options.ignore.forEach(function (pattern) {
      utils.log.detail('ignoring: ' + pattern);
    });

    if (config.options.dump) {
      console.log('--------------');
      console.log(config);
      console.log('--------------');
      console.log(['OS:', process.platform, process.arch].join(' '));
      console.log('node: ' + process.version);
      console.log('nodemon: ' + version);
      console.log('cwd: ' + process.cwd());
      console.log('command: ' + process.argv.join(' '));
      console.log('--------------');
      process.exit();
    }

    monitor.run(config.options);
  });
}

// nodemon.state = {};

nodemon.restart = function () {
  utils.log.status('restarting child process');
  process.emit('nodemon:restart');
};

module.exports = nodemon;