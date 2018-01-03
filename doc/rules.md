# Rules

Given a nodemon.json file that contains:

```json
{
  "ignore": ["*.coffee"],
  "watch": ["server/*.coffee", "test/"]
}
```

Then nodemon detects changes, but what causes nodemon to restart? The ignored files or the watched files? Which wins?

```js
const files = ['server/foo.coffee', 'server/app.js'];

// afterIgnore = ['server/app.js'] now since foo.coffee matches *.coffee
const afterIgnore = files.filter(applyIgnore);

// watch = ['server/foo.coffee'] as it's under the watch
const watched = files.filter(applyWatch);
```

What about:

```js
const files = ['test/app.js', 'test/app.coffee'];

// afterIgnore = ['test/app.js'] now since test/app.coffee matches *.coffee
const afterIgnore = files.filter(applyIgnore);

// watch.length = 2 as watch implies test/*.*
const watched = files.filter(applyWatch);
```
