# nodemon

For use during development of a node.js based application. 

nodemon will watch the files in the directory that nodemon was started, and if they change, it will automatically restart your node application.

nodemon does **not** require *any* changes to your code or method of development. nodemon simply wraps your node application and keeps an eye on any files that have changed. Remember that nodemon is a replacement wrapper for `node`, think of it as replacing the word "node" on the command line when you run your script.

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

# Automatic re-running

nodemon was original written to restart hanging processes such as web servers, but now supports apps that cleanly exit. If your script exits cleanly, nodemon will continue to monitor the directory (or directories) and restart the script if there are any changes.

# Running non-node scripts

nodemon can also be used to execute and monitor other programs. nodemon will read the file extension of the script being run and monitor that extension instead of .js if there's no .nodemonignore:

    nodemon --exec "python -v" ./app.py

Now nodemon will run `app.py` with python in verbose mode (note that if you're not passing args to the exec program, you don't need the quotes), and look for new or modified files with the `.py` extension.

# Monitoring multiple directories

By default nodemon monitors the current working directory. If you want to take control of that option, use the `--watch` option to add specific paths:

    nodemon --watch app --watch libs app/server.js

Now nodemon will only restart if there are changes in the `./app` or `./libs` directory. By default nodemon will traverse sub-directories, so there's no need in explicitly including sub-directories.

# Specifying extension watch list

By default, nodemon looks for files with the `.js` extension. If you use the `--exec` option and monitor `app.py` nodemon will monitor files with the extension of `.py`. However, you can specify your own list with the `-e` switch like so:

    nodemon --ext '.js|.css|.html'
    
Or with alternative syntax:

    nodemon -e js,css,html

Now nodemon will restart on any changes to files in the directory (or subdirectories) with the extensions .js, .css or .html.

# Delaying restarting

In some situations, you may want to wait until a number of files have changed. The timeout before checking for new file changes is 1 second. If you're uploading a number of files and it's taking some number of seconds, this could cause your app to restart multiple time unnecessarily.

To add an extra throttle, or delay restarting, use the `--delay` command:

    nodemon --delay 10 server.js

The delay figure is number of seconds to delay before restarting. So nodemon will only restart your app the given number of seconds after the *last* file change.

# Ignoring files

By default, if nodemon will only restart when a `.js` JavaScript file changes.  In some cases you will want to ignore some specific files, directories or file patterns, to prevent nodemon from prematurely restarting your application.

You can use the [example ignore file](http://github.com/remy/nodemon/blob/master/nodemonignore.example) (note that this example file is not hidden - you must rename it to `.nodemonignore`) as a basis for your nodemon, but it's very simple to create your own:

    # this is my ignore file with a nice comment at the top
    
    /vendor/*     # ignore all external submodules
    /public/*     # static files
    ./README.md   # a specific file
    *.css         # ignore any CSS files too
    :(\d)*\.js    # monitor javascript files with only digits in their name

The ignore file accepts:

* Comments starting with a `#` symbol
* Blank lines
* Specific files
* File patterns (this is converted to a regex, so you have full control of the pattern)
* Unescaped regex's begining with `:`.

**Note** the `.nodemonignore` file is read from the directory you run nodemon from, *not* from the location of the node script you're running.

# Controlling shutdown of your script

nodemon sends a kill signal to your application when it sees a file update. If you need to clean up on shutdown inside your script you can capture the kill signal and handle it yourself.

The following example will listen once for the `SIGUSR2` signal (used by nodemon to restart), run the clean up process and then kill itself for nodemon to continue control:

    process.once('SIGUSR2', function () {
      gracefulShutdown(function () {
        process.kill(process.pid, 'SIGUSR2'); 
      })
    });

Note that the `process.kill` is *only* called once your shutdown jobs are complete. Hat tip to [Benjie Gillam](http://www.benjiegillam.com/2011/08/node-js-clean-restart-and-faster-development-with-nodemon/) for writing technique this up.

# Help! My changes aren't being detected!

nodemon has three potential methods it uses to look for file changes. First, it polls using the find command to search for files modified within the last second. This method works on systems with a BSD based find (Mac, for example). 

Next it tries using node's `fs.watch`. `fs.watch` will not always work however, and nodemon will try and detect if this is the case by writing a file to the tmp directory and seeing if fs.watch is triggered when it's removed. If nodemon finds that fs.watch was not triggered, it will then fall back to the third method (called legacy watch), which works by statting each file in your working directory looking for changes to the last modified time. This is the most cpu intensive method, but it may be the only option on some systems.

In certain cases, like when where you are working on a different drive than your tmp directory is on, `fs.watch` may give you a false positive. You can force nodemon to start using the most compatible legacy method by passing the -L switch, e.g. `nodemon -L /my/odd/file.js`.

# License

MIT [http://rem.mit-license.org](http://rem.mit-license.org)
