module.exports = function() {
  console.log(require('../../package.json').version);
  process.exit(0);
};