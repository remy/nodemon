To create a very basic server the 'http' module is required.

	http = require 'http'

The simplest server is used for testing purposes.

	server = http.createServer (req, res) -> res.end 'hi\n'
	server.listen 8000
	console.log "Listening on port 8000"
