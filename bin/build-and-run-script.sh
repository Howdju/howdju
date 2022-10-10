#! /bin/bash

# This script encapsulates bundling a build script using esbuild.
# esbuild is fast and supports importing TypeScript files.

set -e

echo "Running ${@}"
script_path=$1
echo "Building script ${script_path}"
esbuild "${script_path}" --bundle --platform=node\
 --external:esbuild --external:pg-native --external:dns-sync\
 --outfile="dist/${script_path}"
echo "Running dist/${script_path}" "${@:2}"
node "dist/${script_path}" "${@:2}"
