var version = require('../package.json').version || 'development';
module.exports = version === 'development' ? version + ' version' : 'v' + version;