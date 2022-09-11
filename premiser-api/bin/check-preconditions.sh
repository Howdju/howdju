#!/bin/sh

set -e

node ../bin/check-uncommitted.mjs || {
  echo check-uncommitted failed.
  exit 1
}
yarn run check:pushed || {
  echo check:pushed failed.
  exit 1
}
