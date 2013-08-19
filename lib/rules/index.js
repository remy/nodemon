var utils = require('../utils'),
    add = require('./add'),
    parse = require('./parse');

// exported
var rules = { ignore: [], watch: [] };

/**
 * Test a specific filename as to whether it matches a type
 * of rule, either ignore, or watch, or if no `which` is
 * given, it will return an object with both ignore and watch
 * matches.
 *
 * @param  {String} which
 * @param  {String} filename
 * @return {Boolean|Object}
 */
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


/**
 * Loads a nodemon config file and populates the ignore
 * and watch rules with it's contents, and calls callback
 * with the new rules
 *
 * @param  {String} filename
 * @param  {Function} callback
 */
function load(filename, callback) {
  parse(filename, function (err, result) {
    if (err) {
      // we should have bombed already, but
      console.error(err);
      process.exit(1);
    }

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