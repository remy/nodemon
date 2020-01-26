process.on('SIGINT', function() {
  if (process.argv.length === 3 && process.argv[2] === '--dont-exit') return;
  process.exit();
});
// timer, to keep process running
setInterval(function() {
  // console.log('working');
}, 1000);
