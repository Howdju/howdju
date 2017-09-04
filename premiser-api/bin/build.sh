#! /bin/bash

function finish {
  npm uninstall --save howdju-common
  npm uninstall --save howdju-service-common
}
trap finish EXIT

# For development code sharing, use npm/yarn link.  But for gulp-install to include these dependencies, they must appear in the package.json
# TAG: NEW_LIB
npm install --save ../howdju-common
npm install --save ../howdju-service-common

gulp build