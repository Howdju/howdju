#! /bin/bash

set -e

rm -rf coverage
mkdir -p coverage/workspaces
yarn workspaces foreach -Apv exec bash -c '[ ! -f coverage/coverage-final.json ] && exit 0 || cp coverage/coverage-final.json '$(pwd)'/coverage/workspaces/$(basename $(pwd))-coverage-final.json'
yarn run nyc merge coverage/workspaces coverage/monorepo-coverage.json
yarn run nyc report -t coverage --report-dir coverage/html --reporter=html-spa --reporter=text-summary
