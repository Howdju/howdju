#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$script_dir/do-all.sh" yarn test

if [[ $? = 0 ]]; then
  echo All tests passed.
else
  echo Some tests failed.
fi
