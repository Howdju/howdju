#! /bin/bash

( find . -name '*.js' -and -not -path '*node_modules*' -and -not -path '*dist/*' -print0 | xargs -0 cat ) | wc -l