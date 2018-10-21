#! /bin/bash

( find . \( -name '*.js' -o -name '*.sh' -o -name '*.tf' \) -and -not \( -path '*node_modules*' -o -path '*dist/*' -o -path '*.terraform*' \) -print0 | xargs -0 cat ) | wc -l