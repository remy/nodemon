
console.log('starting up @ ' + (process.env.PORT || 8000));
require('http').createServer(function (req, res) { console.log('Request in'); res.end('ok'); }).listen(process.env.PORT || 8000);
