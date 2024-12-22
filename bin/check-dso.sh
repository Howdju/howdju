#! /bin/bash

commit_msg_file=$1

if [[ -z $commit_msg_file ]]; then
  echo "Usage: $0 <commit_msg_file>"
  exit 1
fi

egrep 'Signed-off-by:.+<.+@.+>' $commit_msg_file > /dev/null
if [ $? -ne 0 ] ; then
  echo Invalid commit message: DCO signoff missing. Please read and understand https://developercertificate.org/ and retry your commit with --signoff to indicate your affirmation that your changes conform with the DCO.
  exit 1
fi
