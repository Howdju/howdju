#! /bin/bash

# For development code sharing, use npm/yarn link.  But for gulp-install to include these dependencies, they must appear in the package.json
# TAG: NEW_LIB
npm install --save ../howdju-common
gulp build
npm uninstall --save howdju-common