// var nodemon = require('../nodemon');
var parse = require('./parse'),
    exec = require('./exec');

/**
 * Converts a string to command line args, in particular
 * groups together quoted values
 *
 * @param  {String} string
 * @return {Array}
 */
function stringToArgs(string) {
  var args = [];

  var parts = string.split(' '),
      length = parts.length,
      i = 0,
      open = false,
      grouped = '',
      lead = '';

  for (; i < length; i++) {
    lead = parts[i].substring(0, 1);
    if (lead === '"' || lead === '\'') {
      open = lead;
      grouped = parts[i].substring(1);
    } else if (open && parts[i].slice(-1) === open) {
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
    parsed.execOptions = exec(parsed.userScript, parsed.options);

    return parsed;
  }
};