#!/usr/bin/env node
'use strict';
var cli = require('../lib/cli');
var nodemon = require('../lib/');
var updateNotifier = require('update-notifier');
var pkg = require('../package.json');
// checks for available update and returns an instance
var notifier = updateNotifier({ pkg: pkg });

if (notifier.update) {
  // notify using the built-in convenience method
  notifier.notify();
}

var options = cli.parse(process.argv);

nodemon(options);