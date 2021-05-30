script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "${script_dir}"/../../bin/check-uncommitted.mjs

yarn run lint
yarn run test

npm version minor

yarn run clean
yarn run build

node "${script_dir}"/zip-lambda.js
node "${script_dir}"/upload-lambda.js
