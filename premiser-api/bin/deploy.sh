#!/usr/bin/env bash

set -e

if [[ -n $2 ]]; then
  git_branch=$1
  lambda_alias=$2
else
  git_branch=master
  lambda_alias=$1
fi

if [[ -z $lambda_alias ]]; then
  echo "Usage: deploy.sh [<git_branch=master>] <lambda_alias>"
  exit 1
fi

echo deploying $git_branch to $lambda_alias

git checkout $git_branch
# git stash save
# git pull --quiet --ff-only
# git stash pop

source $HOME/.bashrc
npm run build-and-update-lambda-function-code
bin/lambda-smoke-test.sh us-east-1 premiserApi file://test-events/login.json || exit $?
publish_result=$(npm run publish-lambda-function-version)
echo publish_result: $publish_result
new_lambda_version=$(echo "$publish_result" | tail -1 | awk '{print $NF}')
npm run update-lambda-function-alias -- --aliasName $lambda_alias --newTarget $new_lambda_version
