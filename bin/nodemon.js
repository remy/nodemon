#!/usr/bin/env node

var cli = require('../lib/cli'),
    nodemon = require('../lib/nodemon');

nodemon(cli.argv(process.argv));