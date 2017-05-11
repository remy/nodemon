'use strict';
var path = require('path');
var fs = require('fs');
require('require.async')(require);

/**
 * Parse the nodemon config file, supporting both old style
 * plain text config file, and JSON or JS version of the config
 *
 * @param  {String}   filename
 * @param  {Function} callback
 */
function parse(filename, callback) {
  var rules = {
    ignore: [],
    watch: [],
  };
  var ext = filename.slice(filename.lastIndexOf('.') + 1)

  if (ext === 'js') {
    return fs.exists(filename, function (exists) {
      if (!exists) {
        return callback(new Error('ENOENT'));
      }
      require.async(path.resolve(filename), function (content) {
        rules = {
          ignore: content.ignore || [],
          watch: content.watch || [],
        };
        return callback(null, rules);
      }, function (error) {
        return callback(error);
      });
    });
  }
  fs.readFile(filename, 'utf8', function (err, content) {
    if (err) {
      return callback(err);
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

      return callback(null, rules);
    }

    // otherwise return the raw file
    return callback(null, { raw: content.split(/\n/) });
  });
}

module.exports = parse;
