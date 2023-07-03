#!/bin/bash

# gfind on macOS: `brew install findutils`
latest_migration_modification=$(gfind premiser-api/db/migrations -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f1 -d" ")
db_dump_modification=$(gfind howdju-service-common/test-data/premiser_test_schema_dump.sql -printf '%T@ %p\n' | cut -f1 -d" ")
if [[ $latest_migration_modification > $db_dump_modification ]]; then
  echo "DB dump is out of date (latest migration: $latest_migration_modification > $db_dump_modification). Please run 'yarn run create:test-db-dump' and commit the changes."
  exit 1
fi
echo "DB dump is up to date."
