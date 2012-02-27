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
    statOffset = 0, // stupid fix for https://github.com/joyent/node/issues/2705
    isWindows = process.platform === 'win32',
    noWatch = process.platform !== 'win32' || !fs.watch,
    // create once, reuse as needed
    reEscComments = /\\#/g,
    reUnescapeComments = /\^\^/g, // note that '^^' is used in place of escaped comments
    reComments = /#.*$/,
    reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,
    reEscapeChars = /[.|\-[\]()\\]/g,
    reAsterisk = /\*/g;

function startNode() {
  util.log('\x1B[32m[nodemon] starting `' + program.options.exec + ' ' + program.args.join(' ') + '`\x1B[0m');

  child = spawn(program.options.exec, program.args);

  lastStarted = +new Date;

  child.stdout.on('data', function (data) {
    util.print(data);
  });

  child.stderr.on('data', function (data) {
    util.error(data);
  });

  child.on('exit', function (code, signal) {
    // this is nasty, but it gives it windows support
    if (isWindows && signal == 'SIGTERM') signal = 'SIGUSR2';
    // exit the monitor, but do it gracefully
    if (signal == 'SIGUSR2') {
      // restart
      startNode();
    } else if (code === 0) { // clean exit - wait until file change to restart
      util.log('\x1B[32m[nodemon] clean exit - waiting for changes before restart\x1B[0m');
      child = null;
    } else if (program.options.exitcrash) {
      util.log('\x1B[1;31m[nodemon] app crashed\x1B[0m');
      process.exit(0);
    } else {
      util.log('\x1B[1;31m[nodemon] app crashed - waiting for file changes before starting...\x1B[0m');
      child = null;
    }
  });

  // pinched from https://github.com/DTrejo/run.js - pipes stdin to the child process - cheers DTrejo ;-)
  if (program.options.stdin) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.pipe(child.stdin);
  }

  setTimeout(startMonitor, timeout);
}

function startMonitor() {
  var changeFunction;

  if (noWatch) {
    changeFunction = function (lastStarted, callback) {
      var cmds = [],
          changed = [];

      dirs.forEach(function(dir) {
        cmds.push('find -L "' + dir + '" -type f -mtime -' + ((+new Date - lastStarted)/1000|0) + 's -print');
      });

      exec(cmds.join(';'), function (error, stdout, stderr) {
        var files = stdout.split(/\n/);
        files.pop(); // remove blank line ending and split

        callback(files);
      });
    }
  } else {
    changeFunction = function (lastStarted, callback) {
      dirs.forEach(function (dir) {
        fs.watch(dir, { persistent: false }, function (event, filename) {
          callback([filename]);
        });
      });
    }
  }

  changeFunction(lastStarted, function (files) {
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
            child.kill(isWindows ? '' : 'SIGUSR2');
          } else {
            startNode();
          }
        }, restartDelay);
        return;
      }
    }
 
    if (noWatch) setTimeout(startMonitor, timeout);
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
      indexOfApp = -1,
      app = null;

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

  if (indexOfApp !== -1) { 
    // not found, so assume we're reading the package.json and thus swallow up all the args
    // indexOfApp = len; 
    app = process.argv[i];
    indexOfApp++;
  } else {
    indexOfApp = len;
  }

  var appargs = [], //process.argv.slice(indexOfApp),
      // app = appargs[0],
      nodemonargs = process.argv.slice(2, indexOfApp - (app ? 1 : 0)),
      arg,
      options = {
        delay: 1,
        watch: [],
        exec: 'node',
        verbose: true,
        js: false, // becomes the default anyway...
        includeHidden: false,
        exitcrash: false,
        stdin: true
        // args: []
      };

  // process nodemon args
  args.splice(0, 2);
  while (arg = args.shift()) {
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
      options.watch.push(args.shift());
    } else if (arg === '--exitcrash') {
      options.exitcrash = true;
    } else if (arg === '--delay' || arg === '-d') {
      options.delay = parseInt(args.shift());
    } else if (arg === '--exec' || arg === '-x') {
      options.exec = args.shift();
    } else if (arg === '--no-stdin' || arg === '-I') {
      options.stdin = false;
    } else { //if (arg === "--") {
      // Remaining args are node arguments
      appargs.push(arg);
    }
  }

  var program = { options: options, args: appargs, app: app };

  getAppScript(program);

  return program;
}

function getAppScript(program) {
  if (!program.args.length || program.app === null) {
    // try to get the app from the package.json
    // doing a try/catch because we can't use the path.exist callback pattern
    // or we could, but the code would get messy, so this will do exactly 
    // what we're after - if the file doesn't exist, it'll throw.
    try {
      // note: this isn't nodemon's package, it's the user's cwd package
      program.app = JSON.parse(fs.readFileSync('./package.json').toString()).main;
      if (program.app === undefined) {
        help();
      }
      program.args.unshift(program.app);
    } catch (e) {
      // no app found to run - so give them a tip and get the feck out
      help();
    } 
  } else if (!program.app) {
    program.app = program.args[0];
  }

  program.app = path.basename(program.app);
  program.ext = path.extname(program.app);

  if (program.options.exec.indexOf(' ') !== -1) {
    var execOptions = program.options.exec.split(' ');
    program.options.exec = execOptions.splice(0, 1)[0];
    program.args = execOptions.concat(program.args);
  }

  if (program.options.exec === 'node' && program.ext == '.coffee') {
    program.options.exec = 'coffee';
  }

  if (program.options.exec === 'coffee') {
    //coffeescript requires --nodejs --debug
    var debugIndex = program.args.indexOf('--debug');
    if (debugIndex === -1) debugIndex = program.args.indexOf('--debug-brk');
    if (debugIndex !== -1 && program.args.indexOf('--nodejs') === -1) {
      program.args.splice(debugIndex, 0, '--nodejs');
    }
    // monitor both types - TODO possibly make this an option?
    program.ext = '.coffee|.js';
    if (!program.options.exec || program.options.exec == 'node') program.options.exec = 'coffee';
  }
}

function findStatOffset() {
  var filename = './.stat-test';
  fs.writeFile(filename, function (err) {
    if (err) return;
    fs.stat(filename, function (err, stat) {
      if (err) return;

      statOffset = stat.mtime.getTime() - new Date().getTime();
      fs.unlink(filename);
    });
  });
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
    '',
    '  -d, --delay n    throttle restart for "n" seconds',
    '  -w, --watch dir  watch directory "dir". use once for each',
    '                   directory to watch',
    '  -x, --exec app   execute script with "app", ie. -x "python -v"',
    '  -I, --no-stdin   don\'t try to read from stdin',
    '  -q, --quiet      minimise nodemon messages to start/stop only',
    '  --exitcrash      exit on crash, allows use of nodemon with',
    '                   daemon tools like forever.js',
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

if (!isWindows) { // because windows borks when listening for the SIG* events
  // usual suspect: ctrl+c exit
  process.on('SIGINT', function () {
    child && child.kill('SIGINT');
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', function () {
    cleanup();
    process.exit(0);
  });
}

// TODO on a clean exit, we could continue to monitor the directory and reboot the service

// on exception *inside* nodemon, shutdown wrapped node app
process.on('uncaughtException', function (err) {
  util.log('[nodemon] exception in nodemon killing node');
  util.error(err.stack);
  cleanup();
});


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

if (!program.app) {
  help();
}

if (program.options.verbose) util.log('[nodemon] v' + meta.version);

// this was causing problems for a lot of people, so now not moving to the subdirectory
// process.chdir(path.dirname(app));
dirs.forEach(function(dir) {
  if (program.options.verbose) util.log('\x1B[32m[nodemon] watching: ' + dir + '\x1B[0m');
});

findStatOffset();

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
        if (ext) addIgnoreRule('^((?!' + ext + '$).)*$', true);
      }
    });
  } else {
    readIgnoreFile();
  }
});
