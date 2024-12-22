#!/usr/bin/env bash

set -eo pipefail

# Use gfind on macOS (installed via `brew install findutils`) and find on Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  FIND_CMD="gfind"
else
  FIND_CMD="find"
fi

latest_migration_modification=$($FIND_CMD premiser-api/db/migrations -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f1 -d" ")
db_dump_modification=$($FIND_CMD howdju-service-common/test-data/premiser_test_schema_dump.sql -printf '%T@ %p\n' | cut -f1 -d" ")
if [[ $latest_migration_modification > $db_dump_modification ]]; then
  echo "DB dump is out of date (latest migration: $latest_migration_modification > $db_dump_modification). Please apply all migrations to local DB, run 'yarn run create:test-db-dump', and commit the changes."
  exit 1
fi
echo "DB dump is up to date."
