#! /bin/bash

cd "${0%/*}/../"

( find .\
  \(\
    -name '*.ts' -o\
    -name '*.tsx'\
  \)\
  -and -not \(\
    -path '*.d.ts' -o\
    -path '*node_modules*' -o\
    -path '*dist/*' -o\
    -path '*coverage/*' -o\
    -path '*.terraform*' -o\
    -path '*Pods*'\
  \)\
  -print0 | xargs -0 cat ) | wc -l
