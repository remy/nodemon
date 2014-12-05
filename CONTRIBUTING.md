# Contributing

-WIP - but here's the TL;DR

## Issues

- Please include the output from `nodemon --dump` for diagnosis
- If there's a script that nodemon is having trouble with or is causing nodemon to throw exceptions, please include it in your filed issue to allow me to replicate the issue.

## Sending pull requests

- use the .jshintrc (in the root of the project)
- ensure style is consistent
- new command line options are generally discouraged unless there's a *really* good reason
- add tests for newly added code (and try to mirror directory and file structure if possible)
- spell check

*Important:* when fixing a bug, please commit a **failing test** first so that Travis CI (or I can) can show the code failing. Once that commit is in place, then commit the bug fix, so that we can test *before* and *after*.

Remember that you're developing for multiple platforms and versions of node, so if the tests pass on your Mac or Linux or Windows machine, it *may* not pass elsewhere. I personally have Mac and Linux coverage, I need help with Windows tests.