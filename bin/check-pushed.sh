#!/bin/sh

set -e

echo Checking if current branch is pushed to origin...

current_branch=$(git branch --show-current)
git fetch origin
output=$(git log origin/${current_branch}..${current_branch})

# use `wc -m` (characters) instead of `wc -l` because when there's a single commit, there appears to be no new line,
# and therefore `wc -l` is zero.
if [[ $(echo $output | wc -m) -ne 0 ]]; then
  echo ${current_branch} has commits that are not pushed to origin.
  exit 1
fi

echo ${current_branch} is pushed to origin.
