#!/bin/sh

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$script_dir/do-all.sh" yarn install

cd "$script_dir/.."
yarn install
