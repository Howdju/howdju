#!/usr/bin/env bash

set -eo pipefail

migrations_path="premiser-api/db/migrations/*.sql"
db_dump_path="howdju-service-common/test-data/premiser_test_schema_dump.sql"

# Get the latest git modification time of any migration file
latest_git_migration_modification=$(git log -1 --format=%at -- "$migrations_path")

# Only check local times if there are modified or untracked migration files
if git status --porcelain "$migrations_path" | grep -q '^[?M]'; then
  # Get the latest local modification time of modified/untracked migration files
  # Use stat -f %m for macOS to get modification time in seconds since epoch
  latest_local_migration_modification=$(find premiser-api/db/migrations -name "*.sql" -type f -exec sh -c '
    if git status --porcelain "{}" | grep -q "^[?M]"; then
      stat -f %m "{}"
    fi
  ' \; | sort -nr | head -n1)

  # Use local modification time if we found modified/untracked files
  if [[ -n "$latest_local_migration_modification" ]] && [[ $latest_local_migration_modification > $latest_git_migration_modification ]]; then
    latest_migration_modification=$latest_local_migration_modification
  else
    latest_migration_modification=$latest_git_migration_modification
  fi
else
  latest_migration_modification=$latest_git_migration_modification
fi

# Get Git modification time for the DB dump
db_dump_git_modification=$(git log -1 --format=%at -- "$db_dump_path")

# Only check local time if DB dump is modified or untracked
if git status --porcelain "$db_dump_path" | grep -q '^[?M]'; then
  db_dump_local_modification=$(stat -f %m "$db_dump_path" 2>/dev/null || echo "0")

  # Use local modification time if it's more recent
  if [[ -n "$db_dump_local_modification" ]] && [[ $db_dump_local_modification > $db_dump_git_modification ]]; then
    db_dump_modification=$db_dump_local_modification
  else
    db_dump_modification=$db_dump_git_modification
  fi
else
  db_dump_modification=$db_dump_git_modification
fi

if [[ $latest_migration_modification > $db_dump_modification ]]; then
  echo "DB dump is out of date (latest migration: $latest_migration_modification > $db_dump_modification)." \
    "Please apply all migrations to local DB, run 'yarn run create:test-db-dump'," \
    "and commit the changes."
  exit 1
fi
echo "DB dump is up to date."
