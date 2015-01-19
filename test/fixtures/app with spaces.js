#!/usr/bin/env node
console.log(process.argv[2] || 'OK');
require('http').createServer(function (req, res) { console.log('Request in'); res.end('ok'); }).listen(process.env.PORT || 8000);