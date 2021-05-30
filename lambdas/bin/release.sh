script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "${script_dir}"/../../bin/check-uncommitted.mjs
node "${script_dir}"/../../bin/check-pushed.sh

yarn run lint
yarn run test

npm version minor

node "${script_dir}"/../../bin/check-uncommitted.mjs
node "${script_dir}"/../../bin/check-pushed.sh

yarn run clean
yarn run build

node "${script_dir}"/zip-lambda.js
node "${script_dir}"/upload-lambda.js
