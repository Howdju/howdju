#!/bin/sh

set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
package_dir="$(dirname "$script_dir")"
root_dir="$(dirname "$package_dir")"
check_dirs=(
"$package_dir"
"$root_dir"/howdju-test-common
"$root_dir"/howdju-common
"$root_dir"/howdju-client-common
)

for check_dir in "${check_dirs[@]}"; do
  [[ -z $(git status -s "$check_dir") ]] || {
    echo "There are uncommitted changes in $check_dir"
    exit 1
  }
done
