#! /bin/bash

set -e

DEBUG=*,-agentkeepalive ../bin/build-and-run-script.sh bin/check-standalone-schema-validation-code.js
