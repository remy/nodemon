# FAQ 

This is being added to as common issues occur on the [issues](http://github.com/remy/nodemon/issues), and where appropriate the answers will be added here.

This is a working document, and if it makes sense, I'll take pull requests to help make it better.

## nodemon doesn't work with fedora

Fedora is looking for `nodejs` rather than `node` which is the binary that nodemon kicks off.

The solution is a simple workaround, Linux 101:

```
sudo ln -s /usr/bin/nodejs /usr/local/bin/node
```

Fedora and Ubuntu pakage node as nodejs, because node.dpkg is

> Description-en: Amateur Packet Radio Node program
 The node program accepts TCP/IP and packet radio network connections and
 presents users with an interface that allows them to make gateway connections
 to remote hosts using a variety of amateur radio protocols.
They make the binary is nodejs, rather than node. So long as you're not using that Packet Radio Node Program mentioned above the workaround will work.

Thank you [@EvanCarroll](https://github.com/remy/nodemon/issues/68#issuecomment-13672509)

## Using nodemon with forever

If you're using nodemon with [forever](https://github.com/nodejitsu/forever) (perhaps in a production environment) you can combine the two together. This way if the script crashes, forever restarts the script, and if there are file changes, nodemon restarts your script. For more detail, see [issue 30](https://github.com/remy/nodemon/issues/30).

To acheive this you need to include the `--exitcrash` flag to ensure nodemon exits if the script crashes (or exits unexpectedly):

    forever nodemon --exitcrash server.js

To test this, you can kill the server.js process and forever will restart it. If you `touch server.js` nodemon will restart it.

Note that I *would not* recommend using nodemon in a production environment - but that's because I wouldn't want it restart without my explicit instruction.

