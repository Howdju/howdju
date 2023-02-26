#! /bin/bash

base=${1:-master}
target=${2:-HEAD}

git diff $base $target ':(exclude)bin/check-todo-format.sh' | grep '^+' | egrep '\bTODO\b' | egrep -v '\bTODO\(\d+\)'

# grep returns 0 if it found matches. It is an error if we found matches.
if [ $? -eq 0 ] ; then
  echo "TODOs must match the pattern TODO(<issue-number>)"
  exit 1;
fi
