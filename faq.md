# FAQ

This is being added to as common issues occur on the [issues](http://github.com/remy/nodemon/issues), and where appropriate the answers will be added here.

This is a working document, and if it makes sense, I'll take pull requests to help make it better.

# How to clear the console on restart

Rather than being a(nother) feature in nodemon, and as per the [design principles](https://github.com/remy/nodemon#design-principles) you can clear the console using nodemon's existing architecture.

In your `nodemon.json` (or in your `package.json`) you can include the follow event handler to always clear the console when nodemon starts:

```json
{
  "events": {
    "start": "cls || clear"
  }
}
```

Note that on Windows, this will clear the scroll buffer too. If you try to use node to clear the screen, you may have a race condition between the boot time of your process and the start event. This method should be the fastest.

# nodemon doesn't restart on .env change

This is an edge case with how nodemon watches files. This is because nodemon doesn't know if `.env` is a hidden file with no extension or a `*.env` without a filename.

Nonetheless, to trigger a change on `.env` (or similar files like `.bash_profile`), you need to explicitly tell nodemon to watch the file.

However, now nodemon will *only* watch the `.env` file, so you need to add to what nodemon is watching, i.e. tell nodemon to _also_ watch the current working directory:

```bash
$ nodemon --watch .env --watch app app/index.js
```

# nodemon doesn't work with my REPL

Create an nodemon.json file with the setting:

```js
{
  "restartable": false
}
```

This will leave the STDIN to your application rather than listening for the `rs` command to restart.

# Strange/failing behaviour starting the (node-based) executable

By default, nodemon will try to fork your node scripts ([background reading](https://github.com/remy/nodemon/issues/1025)), however, there are some edge cases where that won't suit your needs. Most of the time the default configuration should be fine, but if you want to force nodemon to spawn your node process, use the `--spawn` option.

# My script arguments are being taken by nodemon

Use the `--` switch to tell nodemon to ignore all arguments after this point. So to pass `-L` to your script instead of nodemon, use:

```
$ nodemon app.js -- -L -opt2 -opt3
```

nodemon will ignore all script arguments after `--` and pass them to your script.

# Error: "process failed, unhandled exit code (2)"

Nodemon will look for exit signals from the child process it runs. When the exit code is `2`, nodemon throws an error. Typically this is because the arguments are bad for the executing program, but it can also be due other reasons.

For example, mocha@3.x will exit with `2` on failing tests. To handle the exit code in a way that nodemon can consume, manually exit the process, i.e.:

```bash
nodemon -x 'mocha test/bad.test.js || exit 1'
```

# You want to suppress the request for support message

Perhaps you're [already supporting nodemon](https://opencollective.com/nodemon) or you're using it in CI and it needs to be quietened.

Include the environment value of `SUPPRESS_SUPPORT=1`.

# Can't install nodemon: permission issue

You may need to install nodemon using `sudo` (which isn't recommended, but I understand it's unavoidable in some environments). If the install fails with this appearing in the npm error log, then you need the following workaround.

```
gyp WARN EACCES user "root" does not have permission to access the dev dir "<some-local-dir>"
```

Try to re-install adding `--unsafe-perm` to the arguments:

```
sudo npm install -g nodemon --unsafe-perm
```

Ref [#713](https://github.com/remy/nodemon/issues/713)

# Help! My changes aren't being detected!

nodemon (from 1.4.2 onwards) uses [Chokidar](https://www.npmjs.com/package/chokidar) as its underlying watch system.

If you find your files aren't being monitored, either nodemon isn't restarting, or it reports that zero files are being watched, then you may need the polling mode.

To enable polling use the legacy flag either via the terminal:

```shell
$ nodemon --legacy-watch
$ nodemon -L # short alias
```

Or via the `nodemon.json`:

```json
{
  "legacyWatch": true
}
```

## nodemon tries to run two scripts

If you see nodemon trying to run two scripts, like:

```
9 Dec 23:52:58 - [nodemon] starting `node ./app.js fixtures/sigint.js`
```

This is because the main script argument (`fixtures/sigint.js` in this case) wasn't found, and a `package.json`'s main file _was_ found. ie. to solve, double check the path to your script is correct.

## What has precedence, ignore or watch?

Everything under the ignore rule has the final word. So if you ignore the `node_modules` directory, but watch `node_modules/*.js`, then all changed files will be ignored, because any changed .js file in the `node_modules` are ignored.

However, there are defaults in the ignore rules that your rules will be merged with, and not override. To override the ignore rules see [overriding the underlying default ignore rules](#overriding-the-underlying-default-ignore-rules).

## Overriding the underlying default ignore rules

The way the ignore rules work is that your rules are merged with the `ignoreRoot` rules, which contain `['.git', 'node_modules', ...]`. So if you ignore `public`, the ignore rule results in `['.git', 'node_modules', ..., 'public']`.

Say you did want to watch the `node_modules` directory. You have to override the `ignoreRoot`. If you wanted this on a per project basis, add the config to you local `nodemon.json`. If you want it for all projects, add it to `$HOME/nodemon.json`:

```json
{
  "ignoreRoot": [".git"]
}
```

Now when ignoring `public`, the ignore rule results in `['.git', 'public']`, and nodemon will restart on `node_modules` changes.

## nodemon doesn't work with fedora

Fedora is looking for `nodejs` rather than `node` which is the binary that nodemon kicks off.

A workaround is to make sure that `node` binary exists in the `PATH`:

```bash
sudo ln -s /usr/bin/nodejs /usr/local/bin/node
```

Alternatively the `--exec nodejs` option can be used.

Fedora and Ubuntu package node as nodejs, because node.dpkg is

> Description-en: Amateur Packet Radio Node program
> The node program accepts TCP/IP and packet radio network connections and
> presents users with an interface that allows them to make gateway connections
> to remote hosts using a variety of amateur radio protocols.
> They make the binary is nodejs, rather than node. So long as you're not using that Packet Radio Node Program mentioned above the workaround will work.

Thank you [@EvanCarroll](https://github.com/remy/nodemon/issues/68#issuecomment-13672509)

## Using nodemon with forever

If you're using nodemon with [forever](https://github.com/foreverjs/forever) (perhaps in a production environment), you can combine the two together. This way if the script crashes, forever restarts the script, and if there are file changes, nodemon restarts your script. For more detail, see [issue 30](https://github.com/remy/nodemon/issues/30).

To achieve this you need to add the following on the call to `forever`:

* Use forever's `-c nodemon` option to tell forever to run `nodemon` instead of `node`.
* Include the nodemon `--exitcrash` flag to ensure nodemon exits if the script crashes (or exits unexpectedly).
* Tell forever to use `SIGTERM` instead of `SIGKILL` when requesting nodemon to stop. This ensures that nodemon can stop the watched node process cleanly.
* Optionally add the `--uid` parameter, adding a unique name for your process. In the example, the uid is set to `foo`.

```bash
forever start --uid foo --killSignal=SIGTERM -c 'nodemon --exitcrash' server.js
```

To test this, you can kill the server.js process and forever will restart it. If you `touch server.js` nodemon will restart it.

To stop the process monitored by forever and nodemon, call the following, using the `uid` we assigned above (`foo`):

```bash
forever stop foo
```

This will stop both nodemon and the node process it was monitoring.

Note that I _would not_ recommend using nodemon in a production environment - but that's because I wouldn't want it restart without my explicit instruction.

## What does "verbose" give me?

The `--verbose` (or `-V`) puts nodemon in verbose mode which adds some detail to starting and restarting.

Additional restart information:

* Which nodemon configs are loaded (local and global if found)
* Which ignore rules are being applied
* Which file extensions are being watch
* The process ID of your application (the `child pid`)
* The process ID of nodemon to manually trigger restarts via kill signals

For example:

```text
14 Apr 15:24:58 - [nodemon] v1.0.17
14 Apr 15:24:58 - [nodemon] reading config /Users/remy/Sites/jsbin-private/nodemon.json
14 Apr 15:24:58 - [nodemon] to restart at any time, enter `rs`
14 Apr 15:24:58 - [nodemon] or send SIGHUP to 58118 to restart
14 Apr 15:24:58 - [nodemon] ignoring: /Users/remy/Sites/jsbin-private/.git/**/* node_modules/**/node_modules
14 Apr 15:24:58 - [nodemon] watching: /Users/remy/Sites/jsbin/views/**/* /Users/remy/Sites/jsbin/lib/**/* ../json/*.json config.dev.json
14 Apr 15:24:58 - [nodemon] watching extensions: json,js,html
14 Apr 15:24:58 - [nodemon] starting `node run.js`
14 Apr 15:24:58 - [nodemon] child pid: 9292
```

When nodemon detects a change, the following addition information is shown:

* Which file(s) triggered the check
* Which (if any) rules the file matched to cause a subsequent restart
* How many rules were matched and out of those rules, how many cause a restart
* A list of all the files that _successfully_ caused a restart

For example, on `lib/app.js` being changed:

```text
14 Apr 15:25:56 - [nodemon] files triggering change check: ../jsbin/lib/app.js
14 Apr 15:25:56 - [nodemon] matched rule: **/Users/remy/Sites/jsbin/lib/**/*
14 Apr 15:25:56 - [nodemon] changes after filters (before/after): 1/1
14 Apr 15:25:56 - [nodemon] restarting due to changes...
14 Apr 15:25:56 - [nodemon] ../jsbin/lib/app.js

14 Apr 15:25:56 - [nodemon] starting `node run.js`
14 Apr 15:25:56 - [nodemon] child pid: 9556
```

## My .nodemonignore is being ignored

The new `nodemon.json` supersedes the `.nodemonignore` file, so if you have both, the `.nodemonignore` is not used at all.

Note that if you have a `nodemon.json` in your `$HOME` path, then this will also supersede the old ignore file (and the _legacy_ format config is ignored).

## nodemon does nothing

On Ubuntu globally installed node applications have been found to have no output when they're run. This _seems_ to be an issue with node not being correctly installed (possibly linked to the binary having to be called `nodejs`).

The solution (that's worked in the past) is to install [nvm](https://github.com/creationix/nvm) first and using it to install node, _rather_ than using `apt-get` (or similar tools) to install node directly.

## If nodemon is facing the watch errors (Mac & Linux)

Try the following command on terminal:

```bash
echo fs.inotify.max_user_watches=582222 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

## "Port in use" with --inspect flag and docker

The workaround is to use [kill-port](https://github.com/tiaanduplessis/kill-port) to close off the debugger port, used similarly to:

```bash
nodemon --delay 80ms --exec 'kill-port -k 9228/tcp; node --inspect=0.0.0.0:9228 ./app/http.js'
```

[Original suggestion here](https://github.com/remy/nodemon/issues/1050#issuecomment-323680697) and [addition information here](https://github.com/remy/nodemon/issues/1346#issuecomment-401218386).

## Windows: nodemon keeps restarting without changes

This _might_ be related to a Microsoft Windows release pertaining to the OS and breaking `fsevents` module (which is used by [chokidar](https://github.com/paulmillr/chokidar) - the underlying watch package).

The workaround is to run the following command:

```bash
fsutil behavior set disablelastaccess 1
```

[Futher reading thread](https://github.com/remy/nodemon/issues/1354)

## Error: Cannot find module 'internal/util/types'

If you see the error `Cannot find module 'internal/util/types'`, the error is solved with a clean npm cache and trying to reinstall the dependency you're working with.

A start is to use the following commands:

```
sudo npm cache clean --force
sudo npm i -g npm
```

Otherwise see [issue #1124](https://github.com/remy/nodemon/issues/1124) for further suggestions.

## No automatic restart when using Docker volumes [issue #419](https://github.com/remy/nodemon/issues/419#issuecomment-391244911)

Some Node.js Docker images do not seem to have the full suite of filesystem process utilities that allow `nodemon` to restart automatically when the code in a mounted volume changes. To handle this, and enable automatic restarts without using legacy mode, you can install the [procps](http://procps.sourceforge.net) package.

Here's an example snippet of a Dockerfile:

```
FROM node:8.9.4-wheezy
RUN apt-get update && apt-get install -y procps
```

## "scripts is disabled on this system" on Windows

Based on [this issue](https://github.com/remy/nodemon/issues/1619), if you see the following on Windows:

```
PS> nodemon app.js
nodemon : File C:\…\nodemon.ps1 cannot be loaded because running scripts is disabled on this system. For more
information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
At line:1 char:1

CategoryInfo : SecurityError: (:) [], PSSecurityException
FullyQualifiedErrorId : UnauthorizedAccess
```

The solution is as follows by [Felipe Jacob](https://github.com/adelbs):

It's a security restriction of the Windows PowerShell.

1. Open up a powershell command window (open it as administrator)
2. To check out current restrictions type "Get-ExecutionPolicy"
3. Enable powershell by typing "Set-ExecutionPolicy remotesigned"

## How can I watch all file types in a folder?

To watch all file types, use `'*'`:

```bash
nodemon --ext '*' --watch public --exec 'python -m SimpleHTTPServer'
```

## Workaround for when --inspect flag is passed and the old process doesn't finish before starting a new process

Based on [this issue](https://github.com/remy/nodemon/issues/2056).

Sometimes when using the `--inspect` flag, nodemon will try to start the a process before the old process is finished. 

This will cause an error trying to up the new process because of the debugger service:

```
[0] [nodemon] restarting due to changes...
[0] [nodemon] starting `node --inspect ./main/index.js`
[0] Starting inspector on 127.0.0.1:9229 failed: address already in use
```

Your application will likely be running the old version code if you see that message, and you will need to stop the app and manually start it again to run the app with the newer code version.

A common cause for this is when graceful shutdowns are doing async tasks, i.e:

```
process.once('SIGUSR2', async () => {
  await db.disconnect()
})
```

Simply removing the `await` keyword would likely fix the issue.

If even after that you still running into that problem, there's a workaround to force kill the debugger whenever nodemon triggers a restart.

You can create a `nodemon.json` file at the project root and add the following config:

```
{
  "events": {
    "restart": "sh -c 'lsof -i :${PORT:-9229} -t | xargs kill'"
  }
}
```

This will run a shell command to kill the process running on the PORT 9229 (default node debug port) whenever nodemon triggers a restart.

It may fail sometimes, but it makes the hot reload works partially.
