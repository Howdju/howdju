set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "${script_dir}"/../../bin/check-committed.mjs
"${script_dir}"/../../bin/check-pushed.sh

yarn run lint
yarn run test

npm version minor
# npm version should commit (and tag) for us, but it won't when the package
# is in a subdirectory of the Git repo: https://github.com/npm/npm/issues/9111
# So create the commit here.
lambda_name=$(cat package.json | jq -r .name)
lambda_version=$(cat package.json | jq -r .version)
git add .
git commit -m "Bump version ${lambda_name}: ${lambda_version}" -s
git tag "versions/${lambda_name}-${lambda_version}"
git push

yarn run clean
yarn run build

"${script_dir}"/../../bin/build-and-run-script.sh "${script_dir}"/zip-lambda.js
"${script_dir}"/../../bin/build-and-run-script.sh "${script_dir}"/upload-lambda.js
