#!/usr/bin/env node

import cli from '../lib/cli/index.js';
import nodemon from '../lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = cli.parse(process.argv);

nodemon(options);

// checks for available update and returns an instance
const pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json'));

if (pkg.version.indexOf('0.0.0') !== 0 && options.noUpdateNotifier !== true) {
  require('simple-update-notifier')({ pkg });
}
