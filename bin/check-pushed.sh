#!/bin/sh

set -e

current_branch=$(git branch --show-current)

# use `wc -m` (characters) instead of `wc -l` because when there's a single commit, there appears to be no new line,
# and therefore `wc -l` is zero.
if [[ $(git fetch origin && git log origin/${current_branch}..${current_branch} | wc -m) -ne 0 ]]; then
  echo "master has commits that are not pushed to origin."
  exit 1
fi
