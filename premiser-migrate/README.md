# premiser-migrate

This workspace contains code for migrating data. Usually the scripts are intended to be used once in
an environment, so the code standards are lower than in production code.

## Howdju 2017 migration

To migrate:

- premiser-api/db/delete-all.sql
- in old db: delete from migration_translations
- yarn run migrate:prod

## Normalize URLs

```sh
yarn run normalize-urls-preprod
```

## WritQuote to MediaExcerpt migration

- Backup DB:

  Local:

  ```sh
  pg_dump_file_name=premiser_local_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
  pg_dump -h 127.0.0.1 -p 5432 premiser -U postgres > $pg_dump_file_name
  ```

  Preprod:

  ```sh
  yarn run db:tunnel
  pg_dump_file_name=premiser_preprod_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
  pg_dump -h 127.0.0.1 -p 5434 howdju_pre_prod -U premiser_rds > $pg_dump_file_name
  ```

  Prod:

  ```sh
  yarn run db:tunnel
  pg_dump_file_name=premiser_prod_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
  pg_dump -h 127.0.0.1 -p 5434 premiser -U premiser_rds > $pg_dump_file_name
  ```

- Add history table

  ```sh
  yarn run db:tunnel:shell:pre-prod
  % \i db/migrations/0036_writ_quote_translation.sql
  ```

- Test migration

  ```sh
  yarn run migrate-writ-quotes-local --test-one-only
  ```

- Run migration

  ```sh
  yarn run migrate-writ-quotes-local
  ```

### Example env file:

```env
DB_USER=...
DB_NAME=howdju_pre_prod_2
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5434
LOG_LEVEL=silly
DEBUG_PRINT_DB_QUERIES=true
MESSAGES_TOPIC_ARN=...
DEFAULT_AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Create new preprod db

It's easier to run the migration on a copy of the data and then rename the database.

```sh
echo 'create database howdju_pre_prod_2;' | psql -h localhost -p 5434 -U premiser_rds postgres
psql -h localhost -p 5434 -U premiser_rds howdju_pre_prod_2 < premiser-api/db/migrations/0000_db-users-privileges.sql
psql -h localhost -p 5434 -U premiser_rds --set ON_ERROR_STOP=on howdju_pre_prod_2 < premiser-migrate/dumps/premiser_preprod_dump-2023-08-25T03:36:34Z.sql
```

Check for active connections (canont rename database with them):

```psql
premiser_migrated=> select pid as process_id,
       usename as username,
       datname as database_name,
       client_addr as client_address,
       application_name,
       backend_start,
       state,
       state_change
from pg_stat_activity;

-- Use process_id from above query
SELECT pg_terminate_backend(7967);
```

Do the rename:

```psql
alter database premiser rename to premiser_old;
alter database premiser_migrated rename to premiser;
```
