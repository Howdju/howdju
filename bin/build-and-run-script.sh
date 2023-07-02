#! /bin/bash

# This script encapsulates bundling a build script using esbuild.
# esbuild is fast and supports importing TypeScript files.
#
# Use NODE_ARGS to pass args to node. E.g.
# `NODE_ARGS=--inspect-break build-and-run-script.sh`

set -e

echo "Building & running ${@}"
script_path=$1
echo "Building script ${script_path}"
esbuild "${script_path}" --bundle --platform=node\
 --external:esbuild --external:dns-sync\
 --target=node14\
 --outfile="dist/${script_path}"
echo "Running" "dist/${script_path}" "${@:2}"
if [[ -n "${NODE_ARGS}" ]]; then
  node "${NODE_ARGS}" "dist/${script_path}" "${@:2}"
else
  node "dist/${script_path}" "${@:2}"
fi
