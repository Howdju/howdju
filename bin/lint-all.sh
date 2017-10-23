#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
base_dir=${script_dir}/../

pushd .

dir=${base_dir}howdju-common
cd ${dir}
echo linting ${dir}
yarn run lint

dir=${base_dir}howdju-service-common
cd ${dir}
echo linting ${dir}
yarn run lint

dir=${base_dir}howdju-ops
cd ${dir}
echo linting ${dir}
yarn run lint

dir=${base_dir}premiser-processing
cd ${dir}
echo linting ${dir}
yarn run lint

dir=${base_dir}premiser-api
cd ${dir}
echo linting ${dir}
yarn run lint

dir=${base_dir}premiser-ui
cd ${dir}
echo linting ${dir}
yarn run lint:app
yarn run lint:build

popd
