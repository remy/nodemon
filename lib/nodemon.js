const debug = require('debug')('nodemon');
const path = require('path');
const monitor = require('./monitor');
const cli = require('./cli');
const version = require('./version');
const util = require('util');
const utils = require('./utils');
const bus = utils.bus;
const help = require('./help');
const config = require('./config');
const spawn = require('./spawn');
const defaults = require('./config/defaults');
const eventHandlers = {};

// this is fairly dirty, but theoretically sound since it's part of the
// stable module API
config.required = utils.isRequired;

function nodemon(settings) {
  nodemon.reset();

  // allow the cli string as the argument to nodemon, and allow for
  // `node nodemon -V app.js` or just `-V app.js`
  if (typeof settings === 'string') {
    settings = settings.trim();
    if (settings.indexOf('node') !== 0) {
      if (settings.indexOf('nodemon') !== 0) {
        settings = 'nodemon ' + settings;
      }
      settings = 'node ' + settings;
    }
    settings = cli.parse(settings);
  }

  // set the debug flag as early as possible to get all the detailed logging
  if (settings.verbose) {
    utils.debug = true;
  }

  if (settings.help) {
    process.stdout._handle.setBlocking(true); // nodejs/node#6456
    console.log(help(settings.help));
    if (!config.required) {
      process.exit(0);
    }
  }

  if (settings.version) {
    version().then(function (v) {
      console.log(v);
      if (!config.required) {
        process.exit(0);
      }
    });
    return;
  }

  // nodemon tools like grunt-nodemon. This affects where
  // the script is being run from, and will affect where
  // nodemon looks for the nodemon.json files
  if (settings.cwd) {
    // this is protection to make sure we haven't dont the chdir already...
    // say like in cli/parse.js (which is where we do this once already!)
    if (process.cwd() !== path.resolve(config.system.cwd, settings.cwd)) {
      process.chdir(settings.cwd);
    }
  }

  let cwd = process.cwd();

  config.load(settings, function (config) {
    if (!config.options.dump && !config.options.execOptions.script &&
      config.options.execOptions.exec === 'node') {
      if (!config.required) {
        console.log(help('usage'));
        process.exit();
      }
      return;
    }

    // before we print anything, update the colour setting on logging
    utils.colours = config.options.colours;

    // always echo out the current version
    utils.log.info(version.pinned);

    cwd = process.cwd();

    if (config.options.cwd) {
      utils.log.detail('process root: ' + cwd);
    }

    config.loaded.map(file => file.replace(cwd, '.')).forEach(file => {
      utils.log.detail('reading config ' + file);
    });

    // echo out notices about running state
    if (config.options.stdin && config.options.restartable) {
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
    } else if (config.options.stdin) {
      // if 'restartable' is disabled (via a nodemon.json)
      // then it's possible we're being used with a REPL
      // so let's make sure we don't eat the key presses
      // but also, since we're wrapping, watch out for
      // special keys, like ctrl+c x 2 or '.exit' or ctrl+d
      let ctrlC = false;
      let buffer = '';

      process.stdin.on('data', function (data) {
        buffer += data;
        data = data.toString();
        const chr = data.charCodeAt(0);

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
      utils.log.info('to restart at any time, enter `' +
        config.options.restartable + '`');
    }

    if (!config.required) {
      const restartSignal = config.options.signal === 'SIGUSR2' ? 'SIGHUP' : 'SIGUSR2';
      process.on(restartSignal, nodemon.restart);
      utils.bus.on('error', () => {
        utils.log.fail((new Error().stack));
      });
      utils.log.detail((config.options.restartable ? 'or ' : '') + 'send ' +
        restartSignal + ' to ' + process.pid + ' to restart');
    }

    const ignoring = config.options.monitor.map(function (rule) {
      if (rule.slice(0, 1) !== '!') {
        return false;
      }

      rule = rule.slice(1);

      // don't notify of default ignores
      if (defaults.ignoreRoot.indexOf(rule) !== -1) {
        return false;
      }

      if (rule.startsWith(cwd)) {
        return rule.replace(cwd, '.');
      }

      return rule;
    }).filter(Boolean).join(' ');

    if (ignoring) utils.log.detail('ignoring: ' + ignoring);

    utils.log.info('watching: ' + config.options.monitor.map(function (rule) {
      return rule.slice(0, 1) !== '!' ? rule : false;
    }).filter(Boolean).join(' '));

    utils.log.detail('watching extensions: ' + (config.options.execOptions.ext || '(all)'));

    if (config.options.dump) {
      utils.log._log('log', '--------------');
      utils.log._log('log', 'node: ' + process.version);
      utils.log._log('log', 'nodemon: ' + version.pinned);
      utils.log._log('log', 'command: ' + process.argv.join(' '));
      utils.log._log('log', 'cwd: ' + cwd);
      utils.log._log('log', ['OS:', process.platform, process.arch].join(' '));
      utils.log._log('log', '--------------');
      utils.log._log('log', util.inspect(config, { depth: null }));
      utils.log._log('log', '--------------');
      if (!config.required) {
        process.exit();
      }

      return;
    }

    config.run = true;

    if (config.options.stdout === false) {
      nodemon.on('start', function () {
        nodemon.stdout = bus.stdout;
        nodemon.stderr = bus.stderr;

        bus.emit('readable');
      });
    }

    if (config.options.events && Object.keys(config.options.events).length) {
      Object.keys(config.options.events).forEach(function (key) {
        utils.log.detail('bind ' + key + ' -> `' +
          config.options.events[key] + '`');
        nodemon.on(key, function () {
          if (config.options && config.options.events) {
            spawn(config.options.events[key], config,
              [].slice.apply(arguments));
          }
        });
      });
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
    debug('bus.once(%s)', event);
    eventHandlers[event].splice(eventHandlers[event].indexOf(handler), 1);
    handler.apply(this, arguments);
  });
  return nodemon;
};

nodemon.emit = function () {
  bus.emit.apply(bus, [].slice.call(arguments));
  return nodemon;
};

nodemon.removeAllListeners = function (event) {
  // unbind only the `nodemon.on` event handlers
  Object.keys(eventHandlers).filter(function (e) {
    return event ? e === event : true;
  }).forEach(function (event) {
    eventHandlers[event].forEach(function (handler) {
      bus.removeListener(event, handler);
      eventHandlers[event].splice(eventHandlers[event].indexOf(handler), 1);
    });
  });

  return nodemon;
};

nodemon.reset = function (done) {
  bus.emit('reset', done);
};

bus.on('reset', function (done) {
  debug('reset');
  nodemon.removeAllListeners();
  monitor.run.kill(true, function () {
    utils.reset();
    config.reset();
    config.run = false;
    if (done) {
      done();
    }
  });
});

// expose the full config
nodemon.config = config;

module.exports = nodemon;

