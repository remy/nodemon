# Sample nodemon.json

Here is an example (of a contrived) `nodemon.json` file:

    {
      "script": "./test/fixtures/app.js",
      "restartable": "rs",
      "ignore": [
        "\\.git",
        "node_modules/.*.*/node_modules"
      ],
      "verbose": true,
      "execMap": {
        "py": "python",
        "rb": "ruby"
      },
      "watch": [
        ".js$"
      ],
      "stdin": true,
      "exec": "node"
      "execOptions": {
        "script": "./test/fixtures/app.js",
        "exec": "node",
        "ext": ".js$",
        "execArgs": []
      }
    }