#!/bin/sh

set -e

node ../../bin/check-uncommitted.mjs
yarn run check:pushed
