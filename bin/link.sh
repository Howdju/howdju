#! /bin/bash

# Run this before running locally to allow the applications to find the libraries

# During development, we share library code via `npm link`ing.  This creates symlinks in the project's node_modules dir, allowing
#  node to resolve the libraries.  Note, however, that the libraries are not generally listed in the package.json
#  (if they were, `npm install` would fail because it would be unable to locate the library, as we have not published them
#  to a node repository.)  If necessary, during build steps, we may temporarily install the local libraries to the
#  application libraries and then remove them afterwards.  This is required, e.g., for packaging an app using the
#  npm-install Gulp task.

current_dir=$(pwd)
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
base_dir="$( cd "${script_dir}/../" && pwd )"

cd ${base_dir}/howdju-test-common
yarn link

cd ${base_dir}/howdju-common
yarn link
yarn link howdju-test-common

cd ${base_dir}/howdju-ops
yarn link
yarn link howdju-test-common

cd ${base_dir}/howdju-service-common
yarn link
yarn link howdju-test-common
yarn link howdju-common

cd ${base_dir}/premiser-api
yarn link howdju-test-common
yarn link howdju-common
yarn link howdju-service-common
yarn link howdju-ops

cd ${base_dir}/premiser-processing
yarn link howdju-test-common
yarn link howdju-ops

cd ${base_dir}/howdju-client-common
yarn link
yarn link howdju-common

cd ${base_dir}/premiser-ext
yarn link howdju-client-common

cd ${base_dir}/premiser-ui
yarn link howdju-test-common
yarn link howdju-common
yarn link howdju-client-common

cd ${current_dir}
