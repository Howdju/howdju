# Howdju service common

This repo contains code shared by server-side processes.

## Test database dump

Whenever you update migrations, be sure to update the test DB dump:

```sh
yarn run create:test-db-dump
```

## Debugging database queries

```sh
DEBUG_PRINT_DB_QUERIES=true yarn run test MediaExcerptsService --testNamePattern="'re-uses related entities'"
```

## Debugging a test database

Connect to the local database. You'll need the password from config/test.env.

```sh
psql -h localhost -p 5434 -U postgres;
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
