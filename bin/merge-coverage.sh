#! /bin/bash

set -e

echo Merging coverage reports...

echo Deleting $(pwd)/coverage
rm -rf $(pwd)/coverage
echo Creating coverage/workspaces
mkdir -p coverage/workspaces
echo Copying coverage report from workspaces
yarn workspaces foreach -Apv exec bash -c '[ ! -f coverage/coverage-final.json ] && exit 0 || cp coverage/coverage-final.json '$(pwd)'/coverage/workspaces/$(basename $(pwd))-coverage-final.json'
echo Merging coverage reports
yarn run nyc merge coverage/workspaces coverage/monorepo-coverage.json
