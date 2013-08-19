#!/usr/bin/env node

var cli = require('../lib/cli'),
    nodemon = require('../lib/'),
    updateNotifier = require('update-notifier'),
    // checks for available update and returns an instance
    notifier = updateNotifier({
      packagePath: '../'
    });

if (notifier.update) {
  // notify using the built-in convenience method
  notifier.notify();
}

nodemon(cli.parse(process.argv));