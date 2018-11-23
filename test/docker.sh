docker build -t nodemon-test-env .
docker run --mount type=bind,source=/Users/remy/Sites/nodemon,target=/src/node_modules/nodemon --name nodemon-test-env --rm -it nodemon-test-env bash

# node /nodemon-src/bin/nodemon.js -V http.js
