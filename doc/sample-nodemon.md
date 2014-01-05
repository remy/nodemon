# Sample nodemon.json

Here is an example (of a contrived) `nodemon.json` file:

    {
      "restartable": "rs",
      "ignore": [
        ".git",
        "node_modules/**/node_modules"
      ],
      "verbose": true,
      "execMap": {
        "js": "node --harmony"
      },
      "watch": [
        "test/fixtures/",
        "test/samples/"
      ],
      "ext": "js json"
    }

Note that the `ignore` used is nodemon's default ignore rule. The complete defaults can be seen here: [defaults.js](https://github.com/remy/nodemon/blob/master/lib/config/defaults.js).