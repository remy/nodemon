#!/usr/bin/env node
'use strict';
var cli = require('../lib/cli'),
    nodemon = require('../lib/'),
    updateNotifier = require('update-notifier'),
    pkg = require('../package.json'),
    // checks for available update and returns an instance
    notifier = updateNotifier({ pkg: pkg });

if (notifier.update) {
  // notify using the built-in convenience method
  notifier.notify();
}

var options = cli.parse(process.argv);

nodemon(options);