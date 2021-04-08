#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$script_dir/do-all.sh" rm -rf node_modules
"$script_dir/do-all.sh" yarn install
