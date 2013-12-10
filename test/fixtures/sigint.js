process.on('SIGINT', function() {
  // do nothing here
});
// timer, to keep process running
setInterval(function() {
  // console.log('working');
}, 1000);
