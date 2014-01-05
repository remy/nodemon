![nodemon logo](http://nodemon.io/nodemon.png)

# nodemon

[![Flattr this](http://api.flattr.com/button/flattr-badge-large.png)](http://flattr.com/thing/1211372/remynodemon-on-GitHub)

For use during development of a node.js based application.

nodemon will watch the files in the directory that nodemon was started, and if they change, it will automatically restart your node application.

nodemon does **not** require *any* changes to your code or method of development. nodemon simply wraps your node application and keeps an eye on any files that have changed. Remember that nodemon is a replacement wrapper for `node`, think of it as replacing the word "node" on the command line when you run your script.

[![NPM version](https://badge.fury.io/js/nodemon.png)](http://badge.fury.io/js/nodemon)
[![Travis Status](https://travis-ci.org/remy/nodemon.png)](https://travis-ci.org/remy/nodemon)

# Installation

Either through forking or by using [npm](http://npmjs.org) (the recommended way):

    npm install -g nodemon

And nodemon will be installed in to your bin path. Note that as of npm v1, you must explicitly tell npm to install globally as nodemon is a command line utility.

# Usage

nodemon wraps your application, so you can pass all the arguments you would normally pass to your app:

    nodemon [your node app]

For example, if my application accepted a host and port as the arguments, I would start it as so:

    nodemon ./server.js localhost 8080

Any output from this script is prefixed with `[nodemon]`, otherwise all output from your application, errors included, will be echoed out as expected.

nodemon also supports running and monitoring [coffee-script](http://jashkenas.github.com/coffee-script/) apps:

    nodemon server.coffee

If no script is given, nodemon will test for a `package.json` file and if found, will run the file associated with the *main* property ([ref](https://github.com/remy/nodemon/issues/14)).

You can also pass the debug flag to node through the command line as you would normally:

    nodemon --debug ./server.js 80

If you have a `package.json` file for your app, you can omit the main script entirely and nodemon will read the `package.json` for the `main` property and use that value as the app.

Also check out the [FAQ](https://github.com/remy/nodemon/blob/master/faq.md) or [issues](https://github.com/remy/nodemon/issues) for nodemon.

## Automatic re-running

nodemon was original written to restart hanging processes such as web servers, but now supports apps that cleanly exit. If your script exits cleanly, nodemon will continue to monitor the directory (or directories) and restart the script if there are any changes.

## Manual restarting

Whilst nodemon is running, if you need to manually restart your application, instead of stopping and restart nodemon, you can simply type `rs` with a carridge return, and nodemon will restart your process.

## Config files

nodemon supports local and global configuration files. These are named `nodemon.json` and can be located in the current working directory or in your home directory.

The specificity is as follows, so that a command line argument will always override the config file settings:

- command line arguments
- local config
- global config

A config file can take any of the command line arguments as JSON key values, for example:

    {
      "verbose": true,
      "ignore": ["*.test.js", "fixtures/*"]
      "execMap": {
        "rb": "ruby",
        "pde": "processing --sketch={{pwd}} --run"
      }
    }

The above `nodemon.json` file might be my global config so that I have support for ruby files and processing files, and I can simply run `nodemon demo.pde` and nodemon will automatically know how to run the script even though out of the box support for processing scripts.

A further example of options can be seen in [sample-nodemon.md]()

*This section needs better documentation, but for now you can also see `nodemon --help config` ([also here]())*.

## Using nodemon as a module

Please see [doc/requireable.md](doc/requireable.md)

## Running non-node scripts

nodemon can also be used to execute and monitor other programs. nodemon will read the file extension of the script being run and monitor that extension instead of .js if there's no .nodemonignore:

    nodemon --exec "python -v" ./app.py

Now nodemon will run `app.py` with python in verbose mode (note that if you're not passing args to the exec program, you don't need the quotes), and look for new or modified files with the `.py` extension.

### Default executables

Using the `nodemon.json` config file, you can define your own default executables using the `execMap` property. This is particularly useful if you're working with a language that isn't supported by default by nodemon.

To add support for nodemon to know about the .pl extension (for Perl), the nodemon.json file would add:

    {
      "execMap": {
         "pl": "perl"
      }
    }

Now running the following, nodemon will know to use `perl` as the executable:

    nodemon script.pl

It's generally recommended to use the global `nodemon.json` to add your own `execMap` options. However, if there's a common default that's missing, this can be merged in to the project so that nodemon supports it by default, by changing [default.js]() and sending a pull request.

## Monitoring multiple directories

By default nodemon monitors the current working directory. If you want to take control of that option, use the `--watch` option to add specific paths:

    nodemon --watch app --watch libs app/server.js

Now nodemon will only restart if there are changes in the `./app` or `./libs` directory. By default nodemon will traverse sub-directories, so there's no need in explicitly including sub-directories.

## Specifying extension watch list

By default, nodemon looks for files with the `.js`, `.coffee`, and `.litcoffee` extensions. If you use the `--exec` option and monitor `app.py` nodemon will monitor files with the extension of `.py`. However, you can specify your own list with the `-e` (or `--ext`) switch like so:

    nodemon -e js,jade

Now nodemon will restart on any changes to files in the directory (or subdirectories) with the extensions .js, .jade.

## Ignoring files

By default, if nodemon will only restart when a `.js` JavaScript file changes. In some cases you will want to ignore some specific files, directories or file patterns, to prevent nodemon from prematurely restarting your application.

This can be done via the command line:

    nodemon --ignore lib/ --ignore tests/

Or specific files can be ignored:

    nodemon --ignore lib/app.js

Patterns can also be ignored (but be sure to quote the arguments):

    nodemon --ignore 'lib/*.js'

Finally regular expressions can be used, but need to be prefixed with a colon (this will ignore all numbered JS files):

    nodemon --ignore ':(\d)+\.js$'

Note that by default, nodemon will ignore the `.git` and `node_modules/**/node_modules` directories.

## Delaying restarting

In some situations, you may want to wait until a number of files have changed. The timeout before checking for new file changes is 1 second. If you're uploading a number of files and it's taking some number of seconds, this could cause your app to restart multiple time unnecessarily.

To add an extra throttle, or delay restarting, use the `--delay` command:

    nodemon --delay 10 server.js

The delay figure is number of seconds to delay before restarting. So nodemon will only restart your app the given number of seconds after the *last* file change.

## Controlling shutdown of your script

nodemon sends a kill signal to your application when it sees a file update. If you need to clean up on shutdown inside your script you can capture the kill signal and handle it yourself.

The following example will listen once for the `SIGUSR2` signal (used by nodemon to restart), run the clean up process and then kill itself for nodemon to continue control:

    process.once('SIGUSR2', function () {
      gracefulShutdown(function () {
        process.kill(process.pid, 'SIGUSR2');
      })
    });

Note that the `process.kill` is *only* called once your shutdown jobs are complete. Hat tip to [Benjie Gillam](http://www.benjiegillam.com/2011/08/node-js-clean-restart-and-faster-development-with-nodemon/) for writing technique this up.

## Using nodemon in your Grunt workflow

Check out the [grunt-nodemon](https://github.com/ChrisWren/grunt-nodemon) plugin to integrate nodemon with the rest of your project's grunt workflow.

# License

MIT [http://rem.mit-license.org](http://rem.mit-license.org)
