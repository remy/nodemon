// default options for config.options
module.exports = {
  restartable: 'rs',
  execMap: {
    py: 'python',
    rb: 'ruby'
    // more can be added here such as ls: lsc - but please ensure it's cross
    // compatible with linux, mac and windows, or make the default.js dynamically
    // append the `.cmd` for node based utilities
  },
  ignore: ['.git', 'node_modules/**/node_modules'],
  watch: ['*.*'],
  stdin: true,
  verbose: false
};