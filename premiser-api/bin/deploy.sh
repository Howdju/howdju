#!/usr/bin/env bash

set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
bash "$script_dir/check-preconditions.sh"

pushd ..
yarn run lint:all || { exit 1; }
yarn run test:all || { exit 1; }
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
