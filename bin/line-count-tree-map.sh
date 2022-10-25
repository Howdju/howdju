#! /bin/bash

cd "${0%/*}/../"

find .\
  \(\
    -name '*.ts' -o\
    -name '*.tsx' -o\
    -name '*.js' -o\
    -name '*.sh' -o\
    -name '*.tf' \
  \)\
  -and -not \(\
    -path '*.d.ts' -o\
    -path '*node_modules*' -o\
    -path '*dist/*' -o\
    -path '*.terraform*' -o\
    -path '*Pods*'\
  \)\
  -print | xargs wc -l | sed '$d' | npx webtreemap-cli
