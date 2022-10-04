#! /bin/bash

set -e

DEBUG=*,-agentkeepalive npx ts-node bin/check-standalone-schema-validation-code.js
