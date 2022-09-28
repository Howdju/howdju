#!/usr/bin/env bash

set -e

lambda_alias=$1

# If we are running in a Github action, then the pre-deploy checks shouldn't
# apply, and we should already have done all the lints and tests.
if [ -z ${HOWDJU_RUNNING_IN_GITHUB_WORKFLOW+present} ]; then
  yarn run check:pre-deploy

  pushd ..
  yarn run lint:all || { exit 1; }
  yarn run typecheck:all || { exit 1; }
  yarn run test:all || { exit 1; }
  yarn run custom-check:all || { exit 1; }
  popd
else
  echo Skipping lint and test because in Github Workflow
fi

yarn run clean
yarn run build
yarn run update-lambda-function-code

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
