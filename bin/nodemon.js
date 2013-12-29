#!/usr/bin/env node
'use strict';
var cli = require('../lib/cli'),
    nodemon = require('../lib/'),
    updateNotifier = require('update-notifier'),
    // checks for available update and returns an instance
    notifier = updateNotifier({ packagePath: '../package' });

if (notifier.update) {
  // notify using the built-in convenience method
  notifier.notify();
}

var options = cli.parse(process.argv);
options.restartable = 'rs';

nodemon(options);