/*global describe:true, it: true */
var parse = require('../../lib/cli/parse'),
    assert = require('assert'),
    fs = require('fs'),
    cwd = process.cwd(),
    commands = require('../fixtures/commands');

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

describe('nodemon parser', function () {
  // console.log(process.cwd());

  commands.forEach(function (command) {
    it('should parse ' + command.command, function () {
      var parsed = parse(stringToArgs('node ' + command.command));

      console.log(parsed.options.exec);

      assert(parsed.options.exec === command.exec);
    });
  });
});