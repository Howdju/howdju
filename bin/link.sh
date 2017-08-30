#! /bin/bash

# Run this before running locally to allow the applications to find the libraries

# During development, we share library code via npm linking.  This creates symlinks in the project's node_modules dir, allowing
#  node to resolve the libraries.  Note, however, that the libraries are not generally listed in the package.json
#  (if they were, `npm install` would fail because it would be unable to locate the library, as we have not published them
#  to a node repository.)  If necessary, during build steps, we may temporarily install the local libraries to the
#  application libraries and then remove them afterwards.

# TAG: NEW_LIB

script_dir="$( dirname "${BASH_SOURCE[0]}" )"
base_dir=${script_dir}/../

cd ${base_dir}/howdju-service-common
npm link ../howdju-common

cd ${base_dir}/premiser-api
npm link ../howdju-common
npm link ../howdju-service-common

cd ${base_dir}/premiser-processing
npm link ../howdju-common
npm link ../howdju-service-common

cd ${base_dir}/premiser-ui
npm link ../howdju-common

cd ${base_dir}