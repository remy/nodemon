// var nodemon = require('../nodemon');
var parse = require('./parse'),
    exec = require('./exec');

function stringToArgs(string) {
  var args = [];

  var parts = string.split(' '),
      length = parts.length,
      i = 0,
      open = false,
      grouped = '';

  for (; i < length; i++) {
    if (parts[i].substring(0, 1) === '"') {
      open = true;
      grouped = parts[i].substring(1);
    } else if (open && parts[i].slice(-1) === '"') {
      open = false;
      grouped += ' ' + parts[i].slice(0, -1);
      args.push(grouped);
    } else if (open) {
      grouped += ' ' + parts[i];
    } else {
      args.push(parts[i]);
    }
  }

  return args;
}

module.exports = {
  parse: function (argv) {
    if (typeof argv === 'string') {
      argv = stringToArgs(argv);
    }

    var parsed = parse(argv);

    parsed.options = exec(parsed.userScript, parsed.options)

    return parsed;
  }
};