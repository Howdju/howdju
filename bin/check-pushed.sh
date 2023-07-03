#!/bin/bash

set -e

echo Checking if current branch is pushed to origin...

current_branch=$(git branch --show-current)
echo Current branch is ${current_branch}
git fetch origin
output=$(git log origin/${current_branch}..${current_branch})

# use `wc -m` (characters) instead of `wc -l` because when there's a single commit, there appears to be no new line,
# and therefore `wc -l` is zero.
if [[ $(echo -n $output | wc -m) -ne 0 ]]; then
  echo ${current_branch} has commits that are not pushed to origin:
  echo "${output}"
  exit 1
fi

echo ${current_branch} is pushed to origin.
