#!/usr/bin/env node

const cli = require('../lib/cli');
const nodemon = require('../lib/');
const options = cli.parse(process.argv);

nodemon(options);
