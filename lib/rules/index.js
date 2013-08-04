var utils = require('../utils'),
    add = require('./add'),
    parse = require('./parse');

// exported
var rules = { ignore: [], watch: [] };

function test(which, filename) {
  // If we are in a Windows machine
  if (utils.isWindows) {
    // Break up the file by slashes
    var fileParts = filename.split(/\\/g);

    // Remove the first piece (C:)
    fileParts.shift();

    // Join the parts together with Unix slashes
    filename = '/' + fileParts.join('/');
  }

  var result = {
    ignore: rules.ignore.re.test(filename),
    watch: rules.watch.re.test(filename)
  };

  return which ? result[which] : result;
}

function load(filename, callback) {
  parse(filename, function (result) {
    if (result.raw) {
      result.raw.forEach(add.bind(null, rules, 'ignore'));
    } else {
      result.ignore.forEach(add.bind(null, rules, 'ignore'));
      result.watch.forEach(add.bind(null, rules, 'watch'));
    }

    callback(rules);
  });
}

module.exports = {
  reset: function () { // just used for testing
    rules = { ignore: [], watch: [] };
  },
  load: load,
  ignore: {
    test: add.bind(null, rules, 'ignore'),
    add: add.bind(null, rules, 'ignore')
  },
  watch: {
    test: add.bind(null, rules, 'watch'),
    add: add.bind(null, rules, 'watch')
  },
  test: test,
  add: add.bind(null, rules),
  rules: rules
};