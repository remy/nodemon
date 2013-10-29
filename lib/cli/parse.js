/*

nodemon is a utility for node, and replaces the use of the executable
node. So the user calls `nodemon foo.js` instead.

nodemon can be run in a number of ways:

`nodemon` - tries to use package.json#main property to run
`nodemon` - if no package, looks for index.js
`nodemon app.js` - runs app.js
`nodemon --arg app.js --apparg` - eats arg1, and runs app.js with apparg
`nodemon --apparg` - as above, but passes apparg to package.json#main (or index.js)
`nodemon --debug app.js

*/

var fs = require('fs'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync;

module.exports = parse;

/**
 * Parses the command line arguments `process.argv` and returns the
 * nodemon options, the user script and the executable script.
 *
 * @param  {Array} full process arguments, including `node` leading arg
 * @return {Object} { options, script, args }
 */
function parse(argv) {
  if (typeof argv === 'string') {
    argv = argv.split(' ');
  }

  var eat = function (i, args) {
    if (i <= args.length) {
      return args.splice(i + 1, 1).pop();
    }
  };

  var args = argv.slice(2),
      script = null,
      nodemonOptions = {
        verbose: false // by default, be chaty
      };

  var nodemonOpt = nodemonOption.bind(null, nodemonOptions);

  // move forward through the arguments
  for (var i = 0; i < args.length; i++) {
    // if the argument looks like a file, then stop eating
    if (args[i] === '.') {
      break;
    }

    if (existsSync(args[i])) {
      script = args.splice(i, 1).pop();
      break;
    }

    if (nodemonOpt(args[i], eat.bind(null, i, args)) !== false) {
      args.splice(i, 1);
      // cycle back one argument, as we just ate this one up
      i--;
    }
  }

  if (script === null) {
    script = findAppScript();
  }

  // var result = {
  //   options: nodemonOptions,
  //   userScript: script,
  //   args: args,
  // };

  nodemonOptions.userScript = script;
  nodemonOptions.args = args;

  return nodemonOptions;
}


/**
 * Given an argument (ie. from process.argv), sets nodemon
 * options and can eat up the argument value
 *
 * @param {Object} options object that will be updated
 * @param {Sting} current argument from argv
 * @param {Function} the callback to eat up the next argument in argv
 * @return {Boolean} false if argument was not a nodemon arg
 */
function nodemonOption(options, arg, eatNext) {
  if (arg === '--debug' || arg === '--debug-brk' || arg === '--nodejs') {
    if (!options.nodeArgs) options.nodeArgs = [];
    options.nodeArgs.push(arg);
  }
  // line seperation on purpose to help legibility
  else if (arg === '--help' || arg === '-h' || arg === '-?') {
    var help = eatNext();
    options.help = help ? help : true;
  }

  else if (arg === '--version' || arg === '-v') {
    options.version = true;
  }

  else if (arg === '--verbose' || arg === '-V') {
    options.verbose = true;
  }

  // FIXME this isn't needed as we'll use verbose to handle debug output
  // else if (arg === '-D') {
  //   options.debug = true;
  // }

  else if (arg === '--js') { // TODO dep this option
    options.js = true;
  }

  else if (arg === '--quiet' || arg === '-q') {
    options.quiet = true;
  }

  else if (arg === '--hidden') { // TODO document this flag?
    options.includeHidden = true;
  }

  else if (arg === '--watch' || arg === '-w') {
    if (!options.watch) options.watch = [];
    options.watch.push(eatNext());
  }

  else if (arg === '--ignore' || arg === '-i') {
    if (!options.ignore) options.ignore = [];
    options.ignore.push(eatNext());
  }

  else if (arg === '--exitcrash') {
    options.exitcrash = true;
  }

  else if (arg === '--delay' || arg === '-d') {
    options.delay = parseInt(eatNext(), 10) * 1000;
  }

  else if (arg === '--exec' || arg === '-x') {
    options.exec = eatNext();
  }

  else if (arg === '--legacy-watch' || arg === '-L') {
    options.forceLegacyWatch = true;
  }

  else if (arg === '--no-stdin' || arg === '-I') {
    options.stdin = false;
  }

  else if (arg === '--ext' || arg === '-e') {
    options.ext = eatNext();
  }

  else {
    return false; // this means we didn't match
  }
}

function findAppScript() {
  var appScript = null;

  // nodemon has been run alone, so try to read the package file
  // or try to read the index.js file

  // doing a try/catch because we can't use the path.exist callback pattern
  // or we could, but the code would get messy, so this will do exactly
  // what we're after - if the file doesn't exist, it'll throw.
  try {
    // note: this isn't nodemon's package, it's the user's cwd package
    appScript = JSON.parse(fs.readFileSync('./package.json').toString()).main;
    if (appScript !== undefined) {
      // no app found to run - so give them a tip and get the feck out
      return appScript;
    }
  } catch (e) {}

  // now try index.js
  if (existsSync('./index.js')) { // FIXME is ./ the right location?
    return 'index.js';
  }

  return null;
}

