// internal
var reEscComments = /\\#/g,
    reUnescapeComments = /\^\^/g, // note that '^^' is used in place of escaped comments
    reComments = /#.*$/,
    reEscapeChars = /[.|\-[\]()\\]/g,
    reAsterisk = /\*/g;

function add(rules, which, rule) {
  if (!{ 'ignore' : 1, 'watch' : 1}[which]) {
    throw new Error('rules/index.js#add requires "ignore" or "watch" as the first argument');
  }

  // remove comments and trim lines
  // this mess of replace methods is escaping "\#" to allow for emacs temp files

  // first up strip comments and remove blank head or tails
  rule = rule.replace(reEscComments, '^^')
             .replace(reComments, '')
             .replace(reUnescapeComments, '#').trim();

  var regexp = false,
      lead = rule.substring(0, 1);

  if (lead === ':') {
    rule = rule.substring(1);
    regexp = true;
  } else if (lead.length === 0) {
    // blank line (or it was a comment)
    return;
  }

  if (regexp) {
    rules[which].push(rule);
  } else {
    rule = rule.replace(reEscapeChars, '\\$&')
               .replace(reAsterisk, '.*');

    rules[which].push(rule);
  }

  // compile a regexp of all the rules for this ignore or watch
  rules[which].re = new RegExp(rules[which].join('|'));
}

module.exports = add;