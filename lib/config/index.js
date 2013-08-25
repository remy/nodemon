/**
 * Manages the internal config of nodemon, checking for the state of support
 * with fs.watch, how nodemon can watch files (using find or fs methods).
 *
 * This is *not* the user's config.
 */

var config = {
  system: {
    noWatch: false,
    watchWorks: false,
  },
  dirs: [],
  timeout: 1000
};

module.exports = config;

module.exports.init = function (ready) {
  require('./checkWatchSupport')(config, function () {
    ready(config);
  });
};