#!/usr/bin/env node
'use strict';
var cli = require('../lib/cli'),
    nodemon = require('../lib/');

if (process.env.NO_UPDATE_NOTIFIER !== '1') {
  // check for available update and notify using built-in convenience method
  var updateNotifier = require('update-notifier');
  var notifier = updateNotifier({ packagePath: '../package' });
  if (notifier.update) {
    notifier.notify();
  }
}

var options = cli.parse(process.argv);

nodemon(options);
