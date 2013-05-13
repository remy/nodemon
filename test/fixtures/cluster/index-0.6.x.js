#!/usr/bin/env node
var cluster = require('cluster');
if (cluster.isMaster) {

  // master
  console.log('starting master');

  var workers = {},
      shutdown = null;

  require('os').cpus().forEach(function() {
    var worker = cluster.fork();
    worker.on('message', function(msg) {
      console.log('worker', worker.pid, 'online');
      workers[worker.pid] = worker;
    });
  });

  cluster.on('death', function(worker, code, signal) {
    console.log('worker ' + worker.pid + ' died');

    delete workers[worker.pid];
    if (! Object.keys(workers).length) {
      console.log('graceful shutdown');
      if (shutdown) {
        process.kill(process.pid, shutdown);
      } else {
        process.exit();
      }
    }
  });

  process.once('SIGUSR2', function () {
    console.log('signal recieved SIGUSR2');
    shutdown = 'SIGUSR2';
    Object.keys(workers).forEach(function (pid) {
      workers[pid].send({cmd: 'shutdown'});
    });
  });
  process.once('SIGINT', function() {
    console.log('signal recieved SIGINT');
    shutdown = 'SIGINT';
    Object.keys(workers).forEach(function (pid) {
      workers[pid].send({cmd: 'shutdown'});
    });
    // empty
    // SIGINT needs to be handled in order to nodemon --graceful switch to work
  });
  process.once('SIGTERM', function () {
    console.log('signal recieved SIGTERM');
    shutdown = 'SIGTERM';
    Object.keys(workers).forEach(function (pid) {
      workers[pid].send({cmd: 'shutdown'});
    });
  });

} else {

  // Workers can share any TCP connection
  // In this case its a HTTP server
  require('http').createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  }).listen(8000);

  // worker
  console.log('starting worker');

  process.on('message', function(msg) {
    if (msg && msg.cmd === 'shutdown') {
      console.log('worker', process.pid, 'exiting');
      process.nextTick(function() {
        process.exit();
      });
    }
  });
  process.once('SIGINT', function() {
    // empty
  });
}

// test1
