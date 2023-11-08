#!/usr/bin/env bash

trap "exit" INT TERM
trap "kill 0" EXIT

env=${1}

npm run db:tunnel &
# The tunnel takes a few seconds to initialize
sleep 10
npm run db:tunnel:shell:${env}
