'use strict';
var monitor = require('./monitor'),
    cli = require('./cli'),
    version = require('./version'),
    util = require('util'),
    utils = require('./utils'),
    bus = utils.bus,
    help = require('./help'),
    config = require('./config'),
    eventHandlers = {};

// this is fairly dirty, but theoretically sound since it's part of the
// stable module API
config.required = utils.isRequired;

function nodemon(settings) {
  nodemon.removeAllListners();
  utils.reset();

  // set the debug flag as early as possible to get all the detailed logging
  if (settings.verbose) {
    utils.debug = true;
  }

  if (typeof settings === 'string') {
    settings = cli.parse(settings);
  }

  // by default, ignore .git and node_modules
  if (!settings.ignore) {
    settings.ignore = ['.git', 'node_modules/**/node_modules'];
  }

  if (settings.help) {
    console.log(help(settings.help));
    if (!config.required) {
      process.exit(0);
    }
  }

  if (settings.version) {
    console.log(version);
    if (!config.required) {
      process.exit(0);
    }
  }

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

        // if the keys entered match the restartable value, then restart!
        if (data === config.options.restartable) {
          bus.emit('restart');
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
      utils.log._log('log', '--------------');
      utils.log._log('log', util.inspect(config, { depth: null }));
      utils.log._log('log', '--------------');
      utils.log._log('log', ['OS:', process.platform, process.arch].join(' '));
      utils.log._log('log', 'node: ' + process.version);
      utils.log._log('log', 'nodemon: ' + version);
      utils.log._log('log', 'cwd: ' + process.cwd());
      utils.log._log('log', 'command: ' + process.argv.join(' '));
      utils.log._log('log', '--------------');
      if (!config.required) {
        process.exit();
      }
    }

    monitor.run(config.options);
  });

  return nodemon;
}

nodemon.restart = function () {
  utils.log.status('restarting child process');
  bus.emit('restart');
  return nodemon;
};

nodemon.addListener = nodemon.on = function (event, handler) {
  if (!eventHandlers[event]) { eventHandlers[event] = []; }
  eventHandlers[event].push(handler);
  bus.on(event, handler);
  return nodemon;
};

nodemon.once = function (event, handler) {
  if (!eventHandlers[event]) { eventHandlers[event] = []; }
  eventHandlers[event].push(handler);
  bus.once(event, function () {
    eventHandlers[event].splice(eventHandlers[event].indexOf(handler), 0);
    handler.apply(this, arguments);
  });
  return nodemon;
};

nodemon.emit = function () {
  bus.emit.apply(bus, [].slice.call(arguments));
  return nodemon;
};

nodemon.removeAllListners = function (event) {
  // unbind only the `nodemon.on` event handlers
  Object.keys(eventHandlers).filter(function (e) {
    return event ? e === event : true;
  }).forEach(function (event) {
    eventHandlers[event].forEach(function (handler) {
      bus.removeListener(event, handler);
      eventHandlers[event].splice(eventHandlers[event].indexOf(handler), 0);
    });
    // delete eventHandlers[event];
  });

  return nodemon;
};

// expose the full config
nodemon.config = config;


// on exception *inside* nodemon, shutdown wrapped node app
process.on('uncaughtException', function (err) {
  console.error('exception in nodemon killing node');
  console.error(err.stack);
  console.error();
  console.error('If appropriate, please file an error: http://github.com/remy/nodemon/issues/new\n');
  if (!config.required) {
    process.exit(1);
  }
});


module.exports = nodemon;

