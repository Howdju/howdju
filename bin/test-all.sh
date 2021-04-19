#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$script_dir/do-all.sh" npm run test

ret_val=$?
if [[ $ret_val = 0 ]]; then
  echo All tests passed.
else
  echo Some tests failed.
  exit $ret_val
fi
