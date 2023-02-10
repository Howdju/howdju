#!/usr/bin/env bash

set -e

# Run jest and start a local DB for integration tests if we are running locally

if [[ -z "${HOWDJU_RUNNING_IN_GITHUB_WORKFLOW+present}" ]]; then
  echo "Not in a Github action; starting a temporary local Postgres container"
  export $(cat ../config/test.env | xargs)
  image_id=$(docker run --rm -d -p $DB_PORT:5432 -e POSTGRES_PASSWORD=$DB_PASSWORD postgres:12.5)
  echo "Started docker image ${image_id}"
fi

if [[ $1 == "inspect" ]]; then
  echo "Running: node --inspect-brk ../node_modules/.bin/jest --runInBand --watch ${@:2}"
  node --inspect-brk ../node_modules/.bin/jest --runInBand --watch ${@:2}
  jest_status=$?
else
  echo "Running: jest ${@:1}"
  jest ${@:1}
  jest_status=$?
fi

if [[ -n "${image_id}" ]]; then
  echo "Stopping docker image ${image_id}"
  docker stop $image_id
fi

exit $jest_status
