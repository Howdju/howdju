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


script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
bash "$script_dir/check-preconditions.sh"

echo deploying $git_branch to $lambda_alias

pushd ..
bin/lint-api.sh || { echo "linting failed"; exit 1; }
bin/test-api.sh || { echo "tests failed"; exit 1; }
popd

npm run build-and-update-lambda-function-code
bin/lambda-smoke-test.sh us-east-1 premiserApi test-events/login.json || {
  echo 'smoke test failed'
  exit 1
}
publish_output=$(npm run publish-lambda-function-version)
echo publish_output = $publish_output
#new_lambda_version=$(echo "$publish_output" | tail -1 | awk '{print $NF}')
#new_lambda_version=$(echo "$publish_output" | tail -1 | pcregrep -o1 "version:\s+ ['\"](\d+)['\"]")
new_lambda_version=$(echo "$publish_output" | tail -1 | sed "s/^.*version:[ ]*['\"]\([0-9][0-9]*\)['\"].*$/\1/")
npm run update-lambda-function-alias -- --aliasName $lambda_alias --newTarget $new_lambda_version
