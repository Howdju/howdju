# premiser-migrate

This workspace contains code for migrating data. Usually the scripts are intended to be used once in
an environment, so the code standards are lower than in production code.

## Howdju 2017 migration

To migrate:

- premiser-api/db/delete-all.sql
- in old db: delete from migration_translations
- yarn run migrate:prod

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
  pg_dump -h 127.0.0.1 -p 5433 howdju_pre_prod -U premiser_rds > $pg_dump_file_name
  ```

  Prod:

  ```sh
  yarn run db:tunnel
  pg_dump_file_name=premiser_prod_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
  pg_dump -h 127.0.0.1 -p 5433 howdju -U premiser_rds > $pg_dump_file_name
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
