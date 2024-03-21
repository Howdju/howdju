#!/usr/bin/env bash

set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "${script_dir}"/../../bin/check-committed.mjs
"${script_dir}"/../../bin/check-pushed.sh
"${script_dir}"/../../bin/check-up-to-date.sh

echo "Running checks…"
yarn run check-format
yarn run lint
yarn run typecheck
yarn run test

echo "Bumping version…"
yarn version minor
# npm version should commit (and tag) for us, but it won't when the package
# is in a subdirectory of the Git repo: https://github.com/npm/npm/issues/9111
# So create the commit here.
lambda_name=$(cat package.json | jq -r .name)
lambda_version=$(cat package.json | jq -r .version)
git add .
git commit -m "Bump version ${lambda_name}: ${lambda_version}" -s
git tag "versions/${lambda_name}-${lambda_version}"
git push

echo "Cleaning build…"
yarn run clean
echo "Building…"
yarn run build

echo "Zipping lambda…"
extra_file=$1
if [[ -n $extra_file ]]; then
  "${script_dir}"/../../bin/build-and-run-script.sh "${script_dir}"/zip-lambda.js --extra-file=$extra_file
else
  "${script_dir}"/../../bin/build-and-run-script.sh "${script_dir}"/zip-lambda.js
fi

echo "Uploading lambda…"
"${script_dir}"/../../bin/build-and-run-script.sh "${script_dir}"/upload-lambda.js
echo "Done with release."
