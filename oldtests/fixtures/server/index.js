var connect = require('connect'),
    sample = require('./foo/bar/sample');

connect().use(connect.static('public')).listen(0);

console.log('Running server. Sample value: ' + sample.foo);
