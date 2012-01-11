#!/usr/bin/env node
var fs = require('fs'),
    util = require('util'),
    childProcess = require('child_process'),
    dirs = [],
    path = require('path'),
    spawn = childProcess.spawn,
    meta = JSON.parse(fs.readFileSync(__dirname + '/package.json')),
    exec = childProcess.exec,
    flag = './.monitor',
    program = getNodemonArgs(),
    child = null, 
    monitor = null,
    ignoreFilePath = './.nodemonignore',
    oldIgnoreFilePath = './nodemon-ignore',
    ignoreFiles = [],
    reIgnoreFiles = null,
    timeout = 1000, // check every 1 second
    restartDelay = 0, // controlled through arg --delay 10 (for 10 seconds)
    restartTimer = null,
    lastStarted = +new Date,
    // create once, reuse as needed
    reEscComments = /\\#/g,
    reUnescapeComments = /\^\^/g, // note that '^^' is used in place of escaped comments
    reComments = /#.*$/,
    reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
    reEscapeChars = /[.|\-[\]()\\]/g,
    reAsterisk = /\*/g;

function startNode() {
  util.log('\x1B[32m[nodemon] starting ' + program.options.exec + '\x1B[0m');

  // console.log('running: ' + program.options.exec + ' ' + program.args.join(' '))
  child = spawn(program.options.exec, program.args);

  lastStarted = +new Date;
  
  child.stdout.on('data', function (data) {
    util.print(data);
  });

  child.stderr.on('data', function (data) {
    util.error(data);
  });

  child.on('exit', function (code, signal) {
    // exit the monitor, but do it gracefully
    if (signal == 'SIGUSR2') {
      // restart
      startNode();
    } else if (code === 0) { // clean exit - wait until file change to restart
      util.log('\x1B[32m[nodemon] clean exit - waiting for changes before restart\x1B[0m');
      child = null;
    } else {
      util.log('\x1B[1;31m[nodemon] app crashed - waiting for file changes before starting...\x1B[0m');
      child = null;
    }
  });
  
  // pinched from https://github.com/DTrejo/run.js - pipes stdin to the child process - cheers DTrejo ;-)
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.pipe(child.stdin);

  setTimeout(startMonitor, timeout);
}

function changedSince(time, dir, callback) {
  callback || (callback = dir);
  var changed = [],
      i = 0,
      j = 0,
      dir = dir && typeof dir !== 'function' ? [dir] : dirs,
      dlen = dir.length,
      todo = 0, // how fucking lame is this? promises anyone?
      flen = 0,
      done = function () {
        todo--;
        if (todo === 0) callback(changed);
      };
    
  dir.forEach(function (dir) {
    todo++;
    fs.readdir(dir, function (err, files) {
      if (err) return;

      files.forEach(function (file) {
        if (program.includeHidden == true || !program.includeHidden && file.indexOf('.') !== 0) {
          todo++;
          file = path.resolve(dir + '/' + file);
          var stat = fs.stat(file, function (err, stat) {
            if (stat) {
              if (stat.isDirectory()) {
                todo++;
                changedSince(time, file, function (subChanged) {
                  if (subChanged.length) changed = changed.concat(subChanged);
                  done();
                });
              } else if (stat.mtime > time) {
                changed.push(file);
              }
            }
            done();
          });
        }
      });
      done();
    });    
  });
}

function startMonitor() {
  changedSince(lastStarted, function (files) {
    if (files.length) {
      // filter ignored files
      if (ignoreFiles.length) {
        files = files.filter(function(file) {
          return !reIgnoreFiles.test(file);
        });
      }

      if (files.length) {
        if (restartTimer !== null) clearTimeout(restartTimer);
        restartTimer = setTimeout(function () {
          if (program.options.verbose) util.log('[nodemon] restarting due to changes...');
          files.forEach(function (file) {
            if (program.options.verbose) util.log('[nodemon] ' + file);
          });
          if (program.options.verbose) util.print('\n\n');

          if (child !== null) {
            child.kill('SIGUSR2');
          } else {
            startNode();
          }
        }, restartDelay);
        return;
      }
    }
     
    setTimeout(startMonitor, timeout);
  });
}

function addIgnoreRule(line, noEscape) {
  // remove comments and trim lines
  // this mess of replace methods is escaping "\#" to allow for emacs temp files
  if (!noEscape) {
    if (line = line.replace(reEscComments, '^^').replace(reComments, '').replace(reUnescapeComments, '#').replace(reTrim, '')) {
       ignoreFiles.push(line.replace(reEscapeChars, '\\$&').replace(reAsterisk, '.*'));
    }    
  } else if (line = line.replace(reTrim, '')) {
    ignoreFiles.push(line);
  }
  reIgnoreFiles = new RegExp(ignoreFiles.join('|'));
}

function readIgnoreFile(curr, prev) {
  // unless the ignore file was actually modified, do no re-read it
  if(curr && prev && curr.mtime.valueOf() === prev.mtime.valueOf()) return;

  fs.unwatchFile(ignoreFilePath);

  // Check if ignore file still exists. Vim tends to delete it before replacing with changed file
  path.exists(ignoreFilePath, function(exists) {
    if (program.options.verbose) util.log('[nodemon] reading ignore list');
    
    // ignoreFiles = ignoreFiles.concat([flag, ignoreFilePath]);
    // addIgnoreRule(flag);
    addIgnoreRule(ignoreFilePath);
    fs.readFileSync(ignoreFilePath).toString().split(/\n/).forEach(function (rule, i) {
      addIgnoreRule(rule);
    });
    fs.watchFile(ignoreFilePath, { persistent: false }, readIgnoreFile);
  });
}

// attempt to shutdown the wrapped node instance and remove
// the monitor file as nodemon exists
function cleanup() {
  child && child.kill();
  // fs.unlink(flag);  
}

function getNodemonArgs() {
  var args = process.argv,
      len = args.length,
      i = 2,
      dir = process.cwd(),
      indexOfApp = -1;

  for (; i < len; i++) {
    if (path.existsSync(dir + '/' + args[i])) {
      // double check we didn't use the --watch or -w opt before this arg
      if (args[i-1] && (args[i-1] == '-w' || args[i-1] == '--watch')) {
        // ignore 
      } else {
        indexOfApp = i;
        break;
      }
    }
  }

  if (indexOfApp == -1) { 
    // not found, so assume we're reading the package.json and thus swallow up all the args
    indexOfApp = len; 
  }

  var appargs = process.argv.slice(indexOfApp),
      app = appargs[0],
      nodemonargs = process.argv.slice(2, indexOfApp),
      arg,
      options = {
        delay: 1,
        watch: [],
        exec: 'node',
        verbose: true,
        js: false, // becomes the default anyway...
        includeHidden: false
        // args: []
      };
  
  // process nodemon args
  while (arg = nodemonargs.shift()) {
    if (arg === '--help' || arg === '-h' || arg === '-?') {
      return help(); // exits program
    } else if (arg === '--version' || arg == '-v') {
      return version(); // also exits
    } else if (arg == '--js') {
      options.js = true;
    } else if (arg == '--quiet' || arg == '-q') {
      options.verbose = false;
    } else if (arg == '--hidden') {
      options.includeHidden = true;
    } else if (arg === '--watch' || arg === '-w') {
      options.watch.push(nodemonargs.shift());
    } else if (arg === '--delay' || arg === '-d') {
      options.delay = parseInt(nodemonargs.shift());
    } else if (arg === '--exec' || arg === '-x') {
      options.exec = nodemonargs.shift();
    } else { //if (arg === "--") {
      // Remaining args are node arguments
      appargs.unshift(arg);
    }
  }

  var program = { nodemon: nodemonargs, options: options, args: appargs, app: app };

  getAppScript(program);

  return program;
}

function getAppScript(program) {
  if (!program.args.length) {
    // try to get the app from the package.json
    // doing a try/catch because we can't use the path.exist callback pattern
    // or we could, but the code would get messy, so this will do exactly 
    // what we're after - if the file doesn't exist, it'll throw.
    try {
      // note: this isn't nodemon's package, it's the user's cwd package
      program.app = JSON.parse(fs.readFileSync('./package.json').toString()).main;
    } catch (e) {
      // no app found to run - so give them a tip and get the feck out
      help();
    }  
  } else {
    program.app = program.args.slice(0, 1);
  }
  
  program.app = path.basename(program.app);
  program.ext = path.extname(program.app);

  if (program.ext === '.coffee') {
    //coffeescript requires --nodejs --debug
    var debugIndex = program.args.indexOf('--debug');
    if (debugIndex >= 0 && program.args.indexOf('--nodejs') === -1) {
      program.args.splice(debugIndex, 0, '--nodejs');
    }
    // monitor both types - TODO possibly make this an option?
    program.ext = '.coffee|.js';
    program.exec = 'coffee';
  }
}

function version() {
  console.log(meta.version);
  process.exit(0);
}

function help() {
  util.print([
    '',
    ' Usage: nodemon [options] [script.js] [args]',
    '',
    ' Options:',
    '  -d, --delay n    throttle restart for "n" seconds',
    '  -w, --watch dir  watch directory "dir". use once for each',
    '                   directory to watch',
    '  -x, --exec app   execute script with "app", ie. -x python',
    '  -q, --quiet      minimise nodemon messages to start/stop only',
    '  -v, --version    current nodemon version',
    '  -h, --help       you\'re looking at it',
    '',
    ' Note: if the script is omitted, nodemon will try to ',
    ' read "main" from package.json and without a .nodemonignore,',
    ' nodemon will monitor .js and .coffee by default.',
    '',
    ' Examples:',
    '',
    '  $ nodemon server.js',
    '  $ nodemon -w ../foo server.js apparg1 apparg2',
    '  $ PORT=8000 nodemon --debug-brk server.js',
    '  $ nodemon --exec python app.py',
    '',
    ' For more details see http://github.com/remy/nodemon/',
    ''
  ].join('\n') + '\n');
  process.exit(0);
}

if (program.options.delay) {
  restartDelay = program.options.delay * 1000;
}

// this is the default - why am I making it a cmd line opt?
if (program.options.js) {
  addIgnoreRule('^((?!\.js|\.coffee$).)*$', true); // ignores everything except JS
}

if (program.options.watch && program.options.watch.length > 0) {
  program.options.watch.forEach(function (dir) {
    dirs.push(path.resolve(dir));
  });
} else {
  dirs.unshift(process.cwd());
}

// anything left over in program.args should be prepended to our application args
// like --debug-brk, etc
if (program.nodemon.length) {
  program.args = program.nodemon.concat(program.args);
}

if (!program.app) {
  help();
}

if (program.options.verbose) util.log('[nodemon] v' + meta.version);

// this was causing problems for a lot of people, so now not moving to the subdirectory
// process.chdir(path.dirname(app));
dirs.forEach(function(dir) {
  if (program.options.verbose) util.log('\x1B[32m[nodemon] watching: ' + dir + '\x1B[0m');
});

if (program.options.verbose) util.log('[nodemon] running ' + program.app);

startNode();

path.exists(ignoreFilePath, function (exists) {
  if (!exists) {
    // try the old format
    path.exists(oldIgnoreFilePath, function (exists) {
      if (exists) {
        if (program.options.verbose) util.log('[nodemon] detected old style .nodemonignore');
        ignoreFilePath = oldIgnoreFilePath;
      } else {
        // don't create the ignorefile, just ignore the flag & JS
        // addIgnoreRule(flag);
        var ext = program.ext.replace(/\./g, '\\.');
        addIgnoreRule('^((?!' + ext + '$).)*$', true);
      }
    });
  } else {
    readIgnoreFile();
  }
});

// this little bit of hoop jumping is because sometimes the file can't be
// touched properly, and it send nodemon in to a loop of restarting.
// this way, the .monitor file is removed entirely, and recreated with 
// permissions that anyone can remove it later (i.e. if you run as root
// by accident and then try again later).
// if (path.existsSync(flag)) fs.unlinkSync(flag);
// fs.writeFileSync(flag, '.'); // requires some content https://github.com/remy/nodemon/issues/36
// fs.chmodSync(flag, '666');

// remove the flag file on exit
process.on('exit', function (code) {
  if (program.options.verbose) util.log('[nodemon] exiting');
  cleanup();
});

// usual suspect: ctrl+c exit
process.on('SIGINT', function () {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', function () {
  cleanup();
  process.exit(0);
});

// TODO on a clean exit, we could continue to monitor the directory and reboot the service

// on exception *inside* nodemon, shutdown wrapped node app
process.on('uncaughtException', function (err) {
  util.log('[nodemon] exception in nodemon killing node');
  util.error(err.stack);
  cleanup();
});
