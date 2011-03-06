#!/usr/local/bin/node
var fs = require('fs'),
    sys = require('sys'),
    childProcess = require('child_process'),
    path = require('path'),
    spawn = childProcess.spawn,
    meta = JSON.parse(fs.readFileSync(__dirname + '/package.json')),
    exec = childProcess.exec,
    flag = './.monitor',
    nodeArgs = process.ARGV.splice(2), // removes 'node' and this script
    app = nodeArgs[0],
    node = null, 
    monitor = null,
    ignoreFilePath = './nodemon-ignore',
    ignoreFiles = [flag, ignoreFilePath], // ignore the monitor flag by default
    reIgnoreFiles = null,
    timeout = 1000, // check every 1 second
    // create once, reuse as needed
    reComments = /#.*$/,
    reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
    reEscapeChars = /[.|\-[\]()\\]/g,
    reAsterisk = /\*/g;

function startNode() {
  sys.log('\x1B[32m[nodemon] starting node\x1B[0m');
  // spawn based on file name extension
  var extname = path.extname(app);
  if (extname === '.js') {
      node = spawn('node', nodeArgs);
  } else if (extname === '.coffee') {
      node = spawn('coffee', nodeArgs);
  }
  
  node.stdout.on('data', function (data) {
    sys.print(data);
  });

  node.stderr.on('data', function (data) {
    sys.error(data);
  });

  node.on('exit', function (code, signal) {
    // exit the monitor, but do it gracefully
    if (signal == 'SIGUSR2') {
      // restart
      startNode();
    } else {
      sys.log('\x1B[1;31m[nodemon] app crashed - waiting for file change before starting...\x1B[0m');
      node = null;
    }
  });
}

function startMonitor() {
  var cmd = 'find . -type f -newer ' + flag + ' -print';

  exec(cmd, function (error, stdout, stderr) {
    var files = stdout.split(/\n/);

    files.pop(); // remove blank line ending and split
    if (files.length) {
      // filter ignored files
      if (ignoreFiles.length) {
        files = files.filter(function(file) {
          return !reIgnoreFiles.test(file);
        });
      }

      fs.writeFileSync(flag, '');

      if (files.length) {
        sys.log('[nodemon] restarting due to changes...');
        files.forEach(function (file) {
          sys.log('[nodemon] ' + file);
        });
        sys.print('\n\n');
        
        if (node !== null) {
          node.kill('SIGUSR2');
        } else {
          startNode();
        }
      }
    }
    
    setTimeout(startMonitor, timeout);
  });
}

function readIgnoreFile() {
  fs.unwatchFile(ignoreFilePath);

  // Check if ignore file still exists. Vim tends to delete it before replacing with changed file
  path.exists(ignoreFilePath, function(exists) {
    if (!exists) {
      // we'll touch the ignore file to make sure it gets created and
      // if Vim is writing the file, it'll just overwrite it - but also
      // prevent from constant file io if the file doesn't exist
      fs.writeFileSync(ignoreFilePath, "\n");
      setTimeout(readIgnoreFile, 500);
      return;
    }
    
    sys.log('[nodemon] reading ignore list');
    
    ignoreFiles = [flag, ignoreFilePath];
    fs.readFileSync(ignoreFilePath).toString().split(/\n/).forEach(function (line) {
      // remove comments and trim lines
      if (line = line.replace(reComments, '').replace(reTrim, '')) {
         ignoreFiles.push(line.replace(reEscapeChars, '\\$&').replace(reAsterisk, '.*'));
      }
    });
    reIgnoreFiles = new RegExp(ignoreFiles.join('|'));

    fs.watchFile(ignoreFilePath, { persistent: false }, readIgnoreFile);
  });
}

function usage() {
  sys.print('usage: nodemon [your node app]\ne.g.: nodemon ./server.js localhost 8080\nFor details see http://github.com/remy/nodemon/\n\n');
}

if (!nodeArgs.length || nodeArgs[0] == 'help') {
  usage();
  process.exit(0);
}

if (nodeArgs[0] == 'version') {
  sys.print('v' + meta.version + '\n');
  process.exit(0);
}


sys.log('[nodemon] v' + meta.version);

// Change to application dir
process.chdir(path.dirname(app));
app = path.basename(app);
sys.log('[nodemon] running ' + app + ' in ' + process.cwd());

startNode();
setTimeout(startMonitor, timeout);

path.exists(ignoreFilePath, readIgnoreFile);

// touch
fs.writeFileSync(flag, '');

// remove the flag file on exit
process.on('exit', function (code) {
  sys.log('[nodemon] exiting');
  fs.unlink(flag);
});

process.on('SIGINT', function () {
  process.exit(0);
});

process.on('uncaughtException', function (err) {
  sys.log('[nodemon] exception in nodemon killing node');
  sys.error(err.stack);
  node.kill();
});
