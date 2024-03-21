# #!/usr/bin/env bash

set -e

echo Checking if current branch is up-to-date with origin...

current_branch=$(git branch --show-current)
echo Current branch is ${current_branch}
git fetch origin
output=$(git rev-list --left-right ${current_branch}..origin/${current_branch})

# use `wc -m` (characters) instead of `wc -l` because when the branch is up-to-date there is a
# single whitespace char. When they are not up-to-date, the command outputs a commit SHA which
# is longer than a single character.
if [[ $(echo -n $output | wc -m) -gt 1 ]]; then
  echo ${current_branch} is not up-to-date with origin:
  git rev-list --left-right --count ${current_branch}..origin/${current_branch}
  exit 1
fi

echo ${current_branch} is up-to-date with origin.
