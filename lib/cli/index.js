import parse from './parse.js';

/**
 * Converts a string to command line args, in particular
 * groups together quoted values.
 * This is a utility function to allow calling nodemon as a required
 * library, but with the CLI args passed in (instead of an object).
 *
 * @param  {String} string
 * @return {Array}
 */
function stringToArgs(string) {
  const args = [];

  const parts = string.split(' ');
  const length = parts.length;
  let i = 0;
  let open = false;
  let grouped = '';
  let lead = '';

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

export default {
  parse: function (argv) {
    if (typeof argv === 'string') {
      argv = stringToArgs(argv);
    }

    return parse(argv);
  },
};
