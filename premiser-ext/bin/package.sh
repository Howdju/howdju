#!/usr/bin/env bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
dist_dir="${script_dir}/../dist"
cd $dist_dir
zip -r howdju *
