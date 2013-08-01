var fs = require('fs');

module.exports = function (filename, callback) {
  var rules = {
    ignore: [],
    watch: []
  };

  fs.readFile(filename, 'utf8', function (err, content) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    var json = null;
    try {
      json = JSON.parse(content);
    } catch (e) {}

    if (json !== null) {
      rules = {
        ignore: json.ignore || [],
        watch: json.watch || [],
      };

      return rules;
    }

    // otherwise parse the file line by line
    content.toString().split(/\n/).forEach(function (rule) {
      rules.ignore.push(rule.trim());
    });

    callback(rules);
  });
};