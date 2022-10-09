#! /bin/bash

echo "build-and-run-script.sh"
package_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../ && pwd )"
script_name=$1
echo "Building script ${script_name}"
esbuild "${package_dir}/bin/${script_name}" --bundle --platform=node\
 --external:esbuild --external:pg-native --outfile="${package_dir}/dist/$script_name"
echo "Running script ${script_name} ${@:2}"
node "${package_dir}/dist/$script_name" "${@:2}"
