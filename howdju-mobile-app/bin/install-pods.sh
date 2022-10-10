#! /bin/bash

set -e

pushd ios
pod install ios
popd
