#! /bin/bash

grep -R\
 --exclude-dir=coverage\
 --exclude-dir=node_modules\
 --exclude-dir=dist\
 --exclude-dir=.yarn\
 --exclude-dir=.git\
 --exclude-dir=Pods\
 --exclude=check-do-not-merge.sh\
 DO_NOT_MERGE\
 .

# grep returns 0 if it found matches. It is an error if we found matches.
if [ $? -eq 0 ] ; then
  echo Remove all DO_NOT_MERGE before merging
  exit 1
fi

echo Merge is not blocked by contents.

exit 0;
