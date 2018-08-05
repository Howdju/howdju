#!/usr/bin/env bash
set -e

# docker image names be like: [[host:port/]registry/]name[:tag][@digest]

keyfile_password=$HOWDJU_DOCKER_KEYFILE_PASSWORD

if [[ -z $keyfile_password ]]; then
  echo -n Please enter SSH keyfile password:
  read -s keyfile_password
  echo
fi

bin/lint-all.sh
bin/test-all.sh

docker build \
  --tag premiser-api-deploy \
  --build-arg keyfile_password=$keyfile_password \
  --build-arg current_date=$(date +%Y-%m-%d:%H:%M:%S.%s) \
  --file docker/api-deploy.dockerfile \
  .
