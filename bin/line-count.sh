#! /bin/bash

cd "${0%/*}/../"

( find .\
  \(\
    -name '*.ts' -o\
    -name '*.js' -o\
    -name '*.sh' -o\
    -name '*.tf' \
  \)\
  -and -not \(\
    -path '*.d.ts' -o\
    -path '*node_modules*' -o\
    -path '*dist/*' -o\
    -path '*.terraform*'\
  \)\
  -print0 | xargs -0 cat ) | wc -l
