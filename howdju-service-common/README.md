# Howdju service common

This repo contains code shared by server-side processes.

## Test database dump

Made with:

```sh
pg_dump --schema-only --no-owner --no-acl --host=127.0.0.1 --port=5432 --dbname=premiser\
 --user=postgres --file=test-data/premiser_test_schema_dump.sql
```

## Debugging a test database

Connect to the local database. You'll need the password from config/test.env.

```sh
psql -h localhost -p 5433 -U postgres;
```

And then from the prompt find and connect to the test database:

```psql
postgres=# \l
                                                    List of databases
                      Name                       |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges
-------------------------------------------------+----------+----------+------------+------------+-----------------------
 howdju_6ab60c08303cb60691de58b4d4e0e236363b8fb8 | postgres | UTF8     | en_US.utf8 | en_US.utf8 |
 ...

postgres=# \c howdju_6ab60c08303cb60691de58b4d4e0e236363b8fb8
```
