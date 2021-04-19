#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$script_dir/do-all.sh" npm run lint
