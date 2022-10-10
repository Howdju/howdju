#! /bin/bash

set -e

artifact_name=$1

bundle_zip=$(mktemp ${TMPDIR}bundle_${artifact_name}_XXXXXX).zip
zip $bundle_zip dist/${artifact_name} >/dev/null
du -h $bundle_zip | awk -v artifact_name=${artifact_name} '{print artifact_name ":\t" $1}'
rm $bundle_zip
