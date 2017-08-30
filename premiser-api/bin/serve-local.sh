#! /bin/bash

DEBUG=premiser-api:* \
NODE_ENV=development \
DO_ASSERT=true \
nodemon \
--watch src \
--watch ../howdju-common/lib \
--watch ../howdju-common/index.js \
--watch ../howdju-service-common/lib \
bin/dev-server.js