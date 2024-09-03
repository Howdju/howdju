#!/usr/bin/env bash

rm dist/tmp/rangeToFragment.js
esbuild src/rangeToFragment.ts --bundle --outfile=dist/tmp/rangeToFragment.js\
 --platform=browser --target=es2016\
 --external:pg-native --external:pg --external:crypto --external:path --external:fs\
 --external:http --external:https --external:./zlib_bindings --external:stream --external:net\
 --external:perf_hooks --external:tls --external:assert --external:os --external:child_process
cmp --silent dist/rangeToFragment.js dist/tmp/rangeToFragment.js || {
  echo "rangeToFragment.js is not up to date. Please run \`yarn run build:range-to-fragment-script\` and commit the changes."
  exit 1
}

rm dist/tmp/getRangesForCurrentFragment.js
esbuild src/getRangesForCurrentFragment.ts --bundle --outfile=dist/tmp/getRangesForCurrentFragment.js\
 --platform=browser --target=es2016
cmp --silent dist/getRangesForCurrentFragment.js dist/tmp/getRangesForCurrentFragment.js || {
  echo "getRangesForCurrentFragment.js is not up to date. Please run \`yarn run build:get-ranges-for-current-fragment-script\` and commit the changes."
  exit 1
}
