#!/bin/sh

module_sub_dirs=(
howdju-test-common
howdju-common
howdju-service-common
howdju-ops
premiser-processing
premiser-api
premiser-ui
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