#!/bin/sh

set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
package_dir="$(dirname "$script_dir")"
root_dir="$(dirname "$package_dir")"
check_dirs=(
"$package_dir"
"$root_dir"/howdju-test-common
"$root_dir"/howdju-common
"$root_dir"/howdju-service-common
"$root_dir"/howdju-ops
"$root_dir"/bin
)

for check_dir in "${check_dirs[@]}"; do
  [[ -z $(git status -s "$check_dir") ]] || {
    echo "There are uncommitted changes in $check_dir"
    exit 1
  }
done

# use `wc -m` (characters) instead of `wc -l` because when there's a single commit, there appears to be no new line,
# and therefore `wc -l` is zero.
if [[ $(git fetch origin && git log origin/master..master | wc -m) -ne 0 ]]; then
  echo "master has commits that are not pushed to origin."
  exit 1
fi
