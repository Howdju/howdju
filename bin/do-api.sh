#!/bin/sh

# Do a command for the API module and its dependency modules. This was easier for me than
# figuring out how to make do-all.sh generic to both the command and the modules.

set -e

module_sub_dirs=(
howdju-test-common
howdju-common
howdju-service-common
howdju-ops
premiser-api
)

command=$@

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
base_dir=${script_dir}/../
ret_val=0

pushd .

for module_sub_dir in "${module_sub_dirs[@]}"; do
  dir="${base_dir}${module_sub_dir}"
  cd "$dir"
  echo running "$command" in "$dir"
  eval "$command"
  if [[ $? != 0 ]]; then
    ret_val=1
  fi
done

popd

exit $ret_val
