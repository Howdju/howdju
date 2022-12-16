# Howdju service common

This repo contains code shared by server-side processes.

## Test database dump

Made with:

```sh
pg_dump --schema-only --no-owner --no-acl --host=127.0.0.1 --port=5432 --dbname=premiser\
 --user=postgres --file=test-data/premiser_test_schema_dump.sql
```
