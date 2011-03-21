# nodemon

For use during development of a node.js based application. 

`nodemon` will watch all the files in the directory that nodemon was started, and if they change, it will automatically restart your node application.

`nodemon` does **not** require *any* changes to your code or method of development. `nodemon` simply wraps your node application and keeps an eye on any files that have changed.

# Installation

Either through forking or:

    npm install nodemon
    
And `nodemon` will be installed in to your bin path.

# Usage

`nodemon` wraps your application, so you can pass all the arguments you would normally pass to your app:

    nodemon [your node app]
    
For example, if my application accepted a host and port as the arguments, I would start it as so:

    nodemon ./server.js localhost 8080

Any output from this script is prefixed with `[nodemon]`, otherwise all output from your application, errors included, will be echoed out as expected.

# Ignoring files

In some cases you will want to ignore some specific files, directories or file patterns, to prevent nodemon from prematurely restarting your application.  

The `nodemon-ignore` file is automatically created in the directory that you run your application from, so that you can have application specific ignore lists. 

You can use the [example ignore file](http://github.com/remy/nodemon/blob/master/nodemon-ignore.example) as a basis for your `nodemon`, but it's very simple to create your own:

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

# CoffeeScript

This fork of `nodemon` can run CoffeeScript instead of Node.js.

    nodemon app.coffee
    
However, you'll have to run javascript version of CoffeeScript file if you want use `--debug` option.

    coffee -c *.coffee lib # compile all coffee files to js in current dir & lib dir
    nodemon --debug app.js

I am planning to patch nodemon later to support CoffeeScript's `--nodejs` option so following command:

    nodemon --debug app.coffee
    
will translate to:

    nodemon --nodejs "--debug" app.coffee
