#!/usr/bin/env bash
set -e

# -it for entering ssh key password
docker run -it --rm premiser-api.deploy bin/deploy.sh "$@"
