var utils = require('../utils');

// exported
var rules = { ignore: [], watch: [] };

// internal
var reEscComments = /\\#/g,
    reUnescapeComments = /\^\^/g, // note that '^^' is used in place of escaped comments
    reComments = /#.*$/,
    reEscapeChars = /[.|\-[\]()\\]/g,
    reAsterisk = /\*/g;


function add(which, rule) {
  if (!{ 'ignore' : 1, 'watch' : 1}[which]) {
    throw new Error('rules/index.js#add requires "ignore" or "watch" as the first argument');
  }

  // remove comments and trim lines
  // this mess of replace methods is escaping "\#" to allow for emacs temp files

  var regexp = false,
      lead = rule.substring(0, 1);

  // first up strip comments and remove blank head or tails
  rule = rule.replace(reComments, '').trim();

  if (lead === ':') {
    rule = rule.substring(1);
    regexp = true;
  } else if (lead === '') {
    // blank line (or it was a comment)
    return;
  }

  if (regexp) {
    rule = rule.replace(reEscComments, '^^')
               .replace(reUnescapeComments, '#')
               .trim();

    if (rule) {
      rule = rule.replace(reEscapeChars, '\\$&')
                 .replace(reAsterisk, '.*');

      rules[which].push(rule);
    }
  } else {
    rule = rule.trim();
    if (rule) {
      rules[which].push(rule);
    }
  }

  rules[which].re = new RegExp(rules[which].join('|'));
}

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

module.exports = {
  parse: require('./parse'),
  ignore: {
    test: add.bind(null, 'ignore'),
    add: add.bind(null, 'ignore')
  },
  watch: {
    test: add.bind(null, 'watch'),
    add: add.bind(null, 'watch')
  },
  test: test,
  add: add,
  rules: rules
};










