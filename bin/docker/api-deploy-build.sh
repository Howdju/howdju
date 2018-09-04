#!/usr/bin/env bash
set -e

# docker image names be like: [[host:port/]registry/]name[:tag][@digest]

keyfile_password=$HOWDJU_DOCKER_KEYFILE_PASSWORD
git_branch=${1:-master}

if [[ -z $keyfile_password ]]; then
  echo -n Please enter SSH keyfile password:
  read -s keyfile_password
  echo
fi

bin/lint-all.sh || { echo "linting failed"; exit 1; }
bin/test-all.sh || { echo "tests failed"; exit 1; }

docker build \
  --tag premiser-api-deploy \
  --build-arg keyfile_password=$keyfile_password \
  --build-arg current_date=$(date +%Y-%m-%d:%H:%M:%S.%s) \
  --build-arg git_branch=$git_branch \
  --file docker/api-deploy.dockerfile \
  .
