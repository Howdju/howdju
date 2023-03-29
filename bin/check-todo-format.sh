#! /bin/bash

base=${1:-master}
# If target is empty, it will compare base with the working tree
target=${2:-}

# Equivalent for the whole repo: egrep --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=Pods --exclude-dir=\.git -RI '\bTODO\b' . | egrep -v '\bTODO\(\d+\)'
git diff $base $target ':(exclude)bin/check-todo-format.sh' | grep '^+' | egrep '\bTODO\b' | egrep -v '\bTODO\(\d+\)'

# grep returns 0 if it found matches. It is an error if we found matches.
if [ $? -eq 0 ] ; then
  echo "TODOs must match the pattern TODO(<issue-number>)"
  exit 1;
fi
