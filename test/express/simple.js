var http = require('http'),
express = require('express');

http.createServer(function (request, response) {
response.writeHead(200, {'Content-Type': 'text/plain'});
response.end('Hello World\n');
console.log('request complete');
}).listen(8888);

console.log('Server running at http://127.0.0.1:8888/');
