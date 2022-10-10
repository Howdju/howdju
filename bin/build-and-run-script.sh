#! /bin/bash

set -e

echo "Running ${@}"
script_path=$1
echo "Building script ${script_path}"
esbuild "${script_path}" --bundle --platform=node\
 --external:esbuild --external:pg-native --outfile="dist/${script_path}"
echo "Running dist/${script_path}" "${@:2}"
node "dist/${script_path}" "${@:2}"
