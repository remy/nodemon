process.stdin.resume();
process.stdin.setEncoding('utf8');
 
process.stdin.on('data', function (chunk) {
 process.stdout.write('data: ' + chunk);
 // foo();
});

var signals = ["SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGEMT", "SIGFPE", 
// "SIGKILL", 
"SIGBUS", 
"SIGSEGV", "SIGSYS", "SIGPIPE", "SIGALRM", "SIGTERM", "SIGUSR1", "SIGUSR2", "SIGCHLD", "SIGPWR", "SIGWINCH", "SIGURG", "SIGPOLL", 
// "SIGSTOP", 
"SIGTSTP", "SIGCONT", "SIGTTIN", "SIGTTOU", "SIGVTALRM", "SIGPROF", "SIGXCPU", "SIGXFSZ", "SIGWAITING", "SIGLWP", "SIGFREEZE", "SIGTHAW", "SIGCANCEL", "SIGLOST", "SIGRTMIN", "SIGRTMAX"];

signals.forEach(function (signal) {
  // console.log('binding ' + signal);
  // process.on(signal, function () {
  //   console.log(signal);
  // });
})