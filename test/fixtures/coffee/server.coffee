http = require 'http'
server = http.createServer (req, res) -> res.end 'hi\n'
server.listen 8000
console.log "Listening on port 8000"
