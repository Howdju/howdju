#!/usr/bin/env bash

set -e

for lambda_dir in lambda-functions/*/; do
    if [[ -f $lambda_dir/package.json ]]; then
        (cd $lambda_dir && echo testing $(pwd) && yarn test)
    fi
done