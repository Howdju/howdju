#! /bin/bash

set -e

DEBUG=* npx ts-node bin/check-standalone-schema-validation-code.js
