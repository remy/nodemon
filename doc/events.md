# Events

nodemon will emit events based on the child process.

## States

- start
- crash
- exit
- config:update

## Commands

- restart
- quit

## Using nodemon events

If nodemon is required, events can be bound and emitted on the nodemon object:

```js
var nodemon = require('nodemon');

nodemon({ script: 'app.js' }).on('start', function () {
  console.log('nodemon started');
}).on('crash', function () {
  console.log('script crashed for some reason');
});

// force a restart
nodemon.emit('restart');

// force a quit
nodemon.emit('quit');
```

If nodemon is a spawned process, then the child (nodemon) will emit message
events whereby the event argument contains the event type, and instead of
emitting events, you `send` the command:

```js
var app = spawnNodemon();

app.on('message', function (event) {
  if (event.type === 'start') {
    console.log('nodemon started');
  } else if (event.type === 'crash') {
    console.log('script crasahed for some reason');
  }
});

// force a restart
app.send('restart');

// for a quit
app.send('quit');
```

Note that even though the child will still emit a `message` event whose type is
`exit`, it makes more sense to listen to the actual `exit` event on the child:

```js
app.on('exit', function () {
  console.log('nodemon quit');
});
```