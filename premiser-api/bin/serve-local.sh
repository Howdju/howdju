#! /bin/bash

script_dir="$( dirname "${BASH_SOURCE[0]}" )"
local_env_file_path="${script_dir}/../../config/local.env"
source "${local_env_file_path}"

nodemon \
  --watch src \
  --watch package.json \
  --watch ../howdju-common/lib \
  --watch ../howdju-service-common/lib \
  bin/dev-server.js