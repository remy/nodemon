var fs = require('fs'),
    path = require('path');

module.exports = help;

function help(item) {
  if (!item) {
    item = 'help';
  } else if (item === true) { // if used with -h or --help and no args
    item = 'help';
  }

  // cleanse the filename to only contain letters
  // aka: /\W/g but figured this was eaiser to read
  item = item.replace(/[^a-z]/gi, '');

  try {
    var body = fs.readFileSync(path.join(__dirname, '..', '..', 'doc', 'cli', item + '.txt'), 'utf8');
    return body;
  } catch (e) {
    return '"' + item + '" help can\'t be found';
  }
}