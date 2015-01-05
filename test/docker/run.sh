#!/bin/bash
docker bui
docker run -v $(pwd)/../../:/app testnodemon ./bin/nodemon.js --remote
