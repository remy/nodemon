# nodemon

For use during development of a node.js based application. 

`nodemon` will watch all the files in the directory that `nodemon` was started, and if they change, it will automatically restart your node application.

`nodemon` does **not** require *any* changes to your code or method of development. `nodemon` simply wraps your node application and keeps an eye on any files that have changed.

# Installation

Either through forking or by using [npm](http://npmjs.org) (the recommended way):

    npm install nodemon -g
    
And `nodemon` will be installed in to your bin path. Note that as of npm v1, you must explicitly tell npm to install globally as `nodemon` is a command line utility.

# Usage

`nodemon` wraps your application, so you can pass all the arguments you would normally pass to your app:

    nodemon [your node app]

For example, if my application accepted a host and port as the arguments, I would start it as so:

    nodemon ./server.js localhost 8080

Any output from this script is prefixed with `[nodemon]`, otherwise all output from your application, errors included, will be echoed out as expected.

`nodemon` also supports running and monitoring [coffee-script](http://jashkenas.github.com/coffee-script/) apps:

    nodemon server.coffee

If no script is given, `nodemon` will test for a `package.json` file and if found, will run the file associated with the *main* property ([ref](https://github.com/remy/nodemon/issues/14)).

You can also pass the debug flag to node through the command line as you would normally:

    nodemon --debug ./server.js 80

Finally, if you have a `package.json` file for your app, you can omit the main script entirely and `nodemon` will read the `package.json` for the `main` property and use that value as the app.

# Delaying restarting

In some situations, you may want to wait until a number of files have changed. The timeout before checking for new file changes is 1 second. If you're uploading a number of files and it's taking some number of seconds, this could cause your app to restart multiple time unnecessarily.

To add an extra throttle, or delay restarting, use the `--delay` command:

    nodemon --delay 10 server.js

The delay figure is number of seconds to delay before restarting. So `nodemon` will only restart your app the given number of seconds after the *last* file change.

# Ignoring files

In some cases you will want to ignore some specific files, directories or file patterns, to prevent `nodemon` from prematurely restarting your application.  

The `.nodemonignore` file is automatically created in the directory that you run your application from, so that you can have application specific ignore lists. 

You can use the [example ignore file](http://github.com/remy/nodemon/blob/master/nodemonignore.example) as a basis for your `nodemon`, but it's very simple to create your own:

    # this is my ignore file with a nice comment at the top
    
    /vendor/*     # ignore all external submodules
    /public/*     # static files
    ./README.md   # a specific file
    *.css         # ignore any CSS files too

The ignore file accepts:

* Comments starting with a `#` symbol
* Blank lines
* Specific files
* File patterns (this is converted to a regex, so you have full control of the pattern)

# Prerequisites

`nodemon` currently depends on the [unix find](http://unixhelp.ed.ac.uk/CGI/man-cgi?find) command (which also is installed on Macs)
