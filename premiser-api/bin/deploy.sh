#!/usr/bin/env bash

set -e

if [[ -n $2 ]]; then
  git_branch=$1
  lambda_alias=$2
else
  git_branch=master
  lambda_alias=${1}
fi

if [[ -z $lamdba_alias ]]; then
  echo "Usage: deploy-lambda.sh [<git_branch=master>] <lambda_alias>"
  exit 1
fi

git checkout $git_branch
git pull --quiet --ff-only

. ~/.nvm/nvm.sh

npm run update-lambda-function-code
publish_result=$(npm run publish-lambda-function-version)
echo $publish_result
new_lambda_version=$(echo "$publish_result" | tail -1 | awk '{print $NF}')
npm run update-lambda-function-alias -- --aliasName $lambda_alias --newTarget $new_lambda_version
