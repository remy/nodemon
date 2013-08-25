var fs = require('fs'),
    path = require('path'),
    utils = require('../utils');

module.exports = help;

function help(item) {
  if (!item) {
    item = 'help';
  } else if (item === true) { // if used with -h or --help and no args
    item = 'help'
  }

  fs.readFile(path.join(__dirname, '..', '..', 'doc', 'cli', item + '.txt'), 'utf8', function (err, body) {
    if (err) {
      return utils.log.error(item + ' help can\'t be found');
    }
    console.log(body);
    process.exit(0);
  });
}