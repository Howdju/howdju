#! /bin/bash

set -e

yarn run check:committed
yarn run check:pushed
