#! /bin/bash

set -e

echo Running pre-deploy checks...

yarn run check:committed
yarn run check:pushed
