// TODO: use fs.watch ?
var fs = require('fs');

var filename = '.nodemon-ping';

// creates .nodemon-ping if it doesn't exist, detroys it if it exists

// sends signal
function ping () {
  //fs.writeFileSync(filename, data);
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
  else {
    fs.closeSync(fs.openSync(filename, 'w'));
  }
}

// receives signal
var interval = 1 * 1000; //ms
function pong (cb) {
  var state = fs.existsSync(filename);
  setInterval(function () {
    //fs.writeFileSync(filename, data);
    var new_state = fs.existsSync(filename);
    if (new_state !== state) {
      cb();
    }
    state = new_state;
  }, interval);
}

module.exports = {
  pong: pong,
  ping: ping
};
