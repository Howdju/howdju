#! /bin/bash

nodemon \
  --watch src \
  --watch package.json \
  --watch ../howdju-common/lib \
  --watch ../howdju-service-common/lib \
  bin/dev-server.js