var fs = require('fs');

module.exports = {
  parse: parse,
  app: getAppScript,
  nodemon: getNodemonArgs
};

function parse(argv) {
  var nodemonArgs = getNodemonArgs(argv);
  var app = getScript(argv);
  var nodeArgs = argv;
}

function getAppScript(argv, callback) {
  var appScript = '';

  if (argv.length === 0) {
    // nodemon has been run alone, so try to read the package file
    // or try to read the index.js file

    // doing a try/catch because we can't use the path.exist callback pattern
    // or we could, but the code would get messy, so this will do exactly
    // what we're after - if the file doesn't exist, it'll throw.
    try {
      // note: this isn't nodemon's package, it's the user's cwd package
      appScript = JSON.parse(fs.readFileSync('./package.json').toString()).main;
      if (appScript === undefined) {
        // no app found to run - so give them a tip and get the feck out
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  // if there's an argument length
}

function getAppScriptOLD(program) {
  var hokeycokey = false;
  if (!program.args.length || program.app === null) {
    // try to get the app from the package.json
    // doing a try/catch because we can't use the path.exist callback pattern
    // or we could, but the code would get messy, so this will do exactly
    // what we're after - if the file doesn't exist, it'll throw.
    try {
      // note: this isn't nodemon's package, it's the user's cwd package
      program.app = JSON.parse(fs.readFileSync('./package.json').toString()).main;
      if (program.app === undefined) {
        // no app found to run - so give them a tip and get the feck out
        help();
      }
      program.args.unshift(program.app);
      hokeycokey = true;
    } catch (e) {}
  }

  // make sure --debug and --debug-brk is moved to the front
  // of the argument
  var debugIndex = -1;
  program.args = program.args.filter(function (arg, i) {
    if (arg.indexOf('--debug') === 0) {
      debugIndex = arg;
      return false;
    } else {
      return true;
    }
  });

  if (debugIndex !== -1) {
    program.args.unshift(debugIndex);
  }

  if (!program.app) {
    program.app = program.args[0];
  }

  program.app = path.basename(program.app);
  program.ext = program.options.ext || path.extname(program.app);

  if (program.options.exec.indexOf(' ') !== -1) {
    var execOptions = program.options.exec.split(' ');
    program.options.exec = execOptions.splice(0, 1)[0];
    program.args = execOptions.concat(program.args);
  }

  if (program.options.exec === 'node' && ((program.ext.indexOf('.coffee') !== -1) || (program.ext.indexOf('.litcoffee') !== -1) )) {
    program.options.exec = 'coffee';
  }

  if (program.options.exec === 'coffee') {
    if (hokeycokey) {
      program.args.push(program.args.shift());
    }

    //coffeescript requires --nodejs --debug

    // this code is a dance to get the order of the debug flags right when combined with coffeescript
    debugIndex = program.args.indexOf('--debug');
    if (debugIndex === -1) {
      debugIndex = program.args.indexOf('--debug-brk');
    }

    if (debugIndex !== -1 && program.args.indexOf('--nodejs') === -1) {
      program.args.splice(debugIndex, 0, '--nodejs');
    }

    // don't override user specified extention tracking
    if (!program.options.ext) {
      program.ext = '.coffee|.litcoffee|.js';
    }

    if (!program.options.exec || program.options.exec === 'node') {
      program.options.exec = 'coffee';
    }

    // because windows can't find 'coffee', it needs the real file 'coffee.cmd'
    if (isWindows) {
      program.options.exec += '.cmd';
    }
  }

  // allow users to make a mistake on the program.ext to monitor
  // converts js,jade => .js|.jade
  // BIG NOTE: user can't do this: nodemon -e *.js
  // because the terminal will automatically expand the glob against the file system :(
  if (program.ext.indexOf(',') !== -1 || program.ext.indexOf('*.') !== -1) {
    program.ext = program.ext.replace(/,/g, '|').split('|').map(function (item) {
      return '.' + item.replace(/^[\*\.]+/, '');
    }).join('$|');
  }
}


function getNodemonArgs(argv) {
  var len = argv.length,
      i = 2,
      dir = process.cwd(),
      indexOfApp = -1,
      app = null;

  for (; i < len; i++) {
    if (existsSync(path.resolve(dir, argv[i]))) {
      // double check we didn't use the --watch or -w opt before this arg
      if (argv[i-1] && (argv[i-1] === '-w' || argv[i-1] === '--watch')) {
        // ignore
      } else {
        indexOfApp = i;
        break;
      }
    }
  }

  if (indexOfApp !== -1) {
    // not found, so assume we're reading the package.json and thus swallow up all the args
    app = argv[i];
    indexOfApp++;
  } else {
    indexOfApp = len;
  }

  var appargs = [],
      nodemonargs = argv.slice(2, indexOfApp - (app ? 1 : 0)),
      arg,
      options = {
        delay: 1,
        watch: [],
        exec: 'node',
        verbose: true,
        js: false, // becomes the default anyway...
        includeHidden: false,
        exitcrash: false,
        forceLegacyWatch: false, // forces nodemon to use the slowest but most compatible method for watching for file changes
        stdin: true
        // args: []
      };

  // process nodemon args
  argv.splice(0, 2);
  while (arg = argv.shift()) {
    if (arg === '--help' || arg === '-h' || arg === '-?') {
      return help(); // exits program
    } else if (arg === '--version' || arg === '-v') {
      return version(); // also exits
    } else if (arg === '--js') {
      options.js = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.verbose = false;
    } else if (arg === '--hidden') { // TODO document this flag?
      options.includeHidden = true;
    } else if (arg === '--watch' || arg === '-w') {
      options.watch.push(argv.shift());
    } else if (arg === '--exitcrash') {
      options.exitcrash = true;
    } else if (arg === '--delay' || arg === '-d') {
      options.delay = parseInt(argv.shift(), 10);
    } else if (arg === '--exec' || arg === '-x') {
      options.exec = argv.shift();
    } else if (arg === '--legacy-watch' || arg === '-L') {
      options.forceLegacyWatch = true;
    } else if (arg === '--no-stdin' || arg === '-I') {
      options.stdin = false;
    } else if (arg === '--ext' || arg === '-e') {
      options.ext = argv.shift();
    } else {
      // Remaining argv are node arguments
      appargs.push(arg);
    }
  }

  var program = { options: options, args: appargs, app: app };

  getAppScript(program);

  return program;
}