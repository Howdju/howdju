#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
base_dir=${script_dir}/../

pushd .

cd ${base_dir}/howdju-common
yarn run lint

cd ${base_dir}/howdju-service-common
yarn run lint

cd ${base_dir}/howdju-ops
yarn run lint

cd ${base_dir}/premiser-api
yarn run lint

cd ${base_dir}/premiser-ui
yarn run lint:app
yarn run lint:build

popd