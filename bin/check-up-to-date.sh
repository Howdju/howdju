# #!/usr/bin/env bash

set -e

echo Checking if current branch is up-to-date with origin...

current_branch=$(git branch --show-current)
echo Current branch is ${current_branch}
git fetch origin
output=$(git rev-list --left-right ${current_branch}..origin/${current_branch})

# use `wc -m` (characters) instead of `wc -l` because when there's a single commit, there appears to be no new line,
# and therefore `wc -l` is zero.
if [[ $(echo -n $output | wc -l) -ne 0 ]]; then
  echo ${current_branch} is not up-to-date with origin:
  git rev-list --left-right --count ${current_branch}..origin/${current_branch}
  exit 1
fi

echo ${current_branch} is up-to-date with origin.
