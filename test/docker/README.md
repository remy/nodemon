On host, run `nodemon --local`. On container or vm, run
nodemon with `nodemon --remote`.

How it works is that the local nodemon toggles the `.nodemon-ping` file
when changes are detected. The remote nodemon simply polls to see if
this file exists and restarts accordingly.
