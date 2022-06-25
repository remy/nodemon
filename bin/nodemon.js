#!/usr/bin/env node

const cli = require('../lib/cli');
const nodemon = require('../lib/');
const options = cli.parse(process.argv);

nodemon(options);

// checks for available update and returns an instance
const pkg = require('../package.json');

if (pkg.version.indexOf('0.0.0') !== 0 && options.noUpdateNotifier !== true) {
  require('../lib/update-notifier')(pkg);
}
