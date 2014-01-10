'use strict';
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
      nodemonOptions = {};

  var nodemonOpt = nodemonOption.bind(null, nodemonOptions),
      lookForArgs = true;

  // move forward through the arguments
  for (var i = 0; i < args.length; i++) {
    // if the argument looks like a file, then stop eating
    if (!script) {
      if (args[i] === '.' || existsSync(args[i])) {
        script = args.splice(i, 1).pop();
        i--;
        continue;
      }
    }

    if (lookForArgs) {
      // respect the standard way of saying: hereafter belongs to my script
      if (args[i] === '--') {
        args.splice(i, 1);
        // cycle back one argument, as we just ate this one up
        i--;

        // ignore all further nodemon arguments
        lookForArgs = false;

        // move to the next iteration
        continue;
      }

      if (nodemonOpt(args[i], eat.bind(null, i, args)) !== false) {
        args.splice(i, 1);
        // cycle back one argument, as we just ate this one up
        i--;
      }
    }
  }

  if (script === null && !nodemonOptions.exec) {
    script = findAppScript();
  }

  // var result = {
  //   options: nodemonOptions,
  //   script: script,
  //   args: args,
  // };

  nodemonOptions.script = script;
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
  if (arg.indexOf('--debug') === 0 || arg === '--debug-brk' || arg === '--nodejs' || arg.indexOf('--harmony') === 0) {
    if (!options.nodeArgs) { options.nodeArgs = []; }
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

  else if (arg === '--dump') {
    options.dump = true;
  }

  else if (arg === '--verbose' || arg === '-V') {
    options.verbose = true;
  }

  // Depricated as this is "on" by default
  else if (arg === '--js') {
    options.js = true;
  }

  else if (arg === '--quiet' || arg === '-q') {
    options.quiet = true;
  }

  else if (arg === '--hidden') { // TODO document this flag?
    options.hidden = true;
  }

  else if (arg === '--watch' || arg === '-w') {
    if (!options.watch) { options.watch = []; }
    options.watch.push(eatNext());
  }

  else if (arg === '--ignore' || arg === '-i') {
    if (!options.ignore) { options.ignore = []; }
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
    options.legacyWatch = true;
  }

  else if (arg === '--no-stdin' || arg === '-I') {
    options.stdin = false;
  }

  else if (arg === '--ext' || arg === '-e') {
    options.ext = eatNext();
  }

  else if (arg === '--cwd') {
    options.cwd = eatNext();

    // go ahead and change directory. This is primarily for nodemon tools like
    // grunt-nodemon - we're doing this early because it will affect where the
    // user script is searched for.
    process.chdir(path.resolve(options.cwd));
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

