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

      return callback(rules);
    }

    // otherwise return the raw file
    return callback({ raw: content.split(/\n/) });
  });
};