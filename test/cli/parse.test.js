/*global describe:true, it: true */
var parse = require('../../lib/cli/parse'),
    assert = require('assert'),
    fs = require('fs'),
    commands = require('../fixtures/commands');

describe('nodemon parser', function () {
  console.log(process.cwd());

  commands.forEach(function (command) {
    it('should parse ' + command, function () {
      var parsed = parse('node ' + command);

      console.log(parsed);
    });
  });
});