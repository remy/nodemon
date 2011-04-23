#!/usr/bin/env node
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

  var ext = path.extname(app);
  if (ext === '.coffee') {
    node = spawn('coffee', nodeArgs);
  } else {
    node = spawn('node', nodeArgs);
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
  sys.print('usage: nodemon [--debug] [your node app]\ne.g.: nodemon ./server.js localhost 8080\nFor details see http://github.com/remy/nodemon/\n\n');
}

function controlArg(arg, label, fn) {
  if (arg == label || arg == '--' + label || arg == '-' + label.substr(0, 1)) {
    fn();
    process.exit();
  }
}

if (!nodeArgs.length) {
  // try to get the app from the package.json
  // doing a try/catch because we can't use the path.exist callback pattern
  // or we could, but the code would get messy, so this will do exactly 
  // what we're after - if the file doesn't exist, it'll throw.
  try {
    app = JSON.parse(fs.readFileSync('./package.json').toString()).main;
    nodeArgs.push(app);
  } catch (e) {
    nodeArgs.push('help'); // default to help
  }
}

// control arguments test for "help" or "--help" or "-h", run the callback and exit
controlArg(nodeArgs[0], 'help', usage);
controlArg(nodeArgs[0], 'version', function () {
  sys.print('v' + meta.version + '\n');
});

if (nodeArgs[0] == '--debug') {
  app = nodeArgs[1];
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
