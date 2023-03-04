#! /bin/bash

# The only parameter is a path to a file containing the message
# https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks
commit_msg_file=$1

egrep 'Signed-off-by:.+<.+@.+>' $commit_msg_file > /dev/null
if [ $? -ne 0 ] ; then
  echo Invalid commit message: DCO signoff missing. Please read and understand https://developercertificate.org/ and retry your commit with --signoff to indicate your affirmation that your changes conform with the DCO.
  exit 1
fi
