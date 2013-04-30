var http = require('http'),
httpProxy = require('http-proxy');
//
// Create your proxy server
//
httpProxy.createServer(9000, 'X.X.X.X').listen(8888);

//
// Create your target server
//
http.createServer(function (req, res) {
console.log('LOGGING');
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
res.end();
}).listen(9000);


