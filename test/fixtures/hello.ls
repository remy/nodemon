http = require 'http'
server = http.createServer (req, res) -> res.end 'hi\n'
server.listen process.env.PORT
console.log "Listening..."
