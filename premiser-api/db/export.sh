# everything:
pg_dump -h 127.0.0.1 -p 5433 premiser -U premiser_rds > premiser_prod_dump-$(date -u "+%Y-%m-%dT%H:%M:%SZ").sql

# schema-only:
pg_dump -s -x -h 127.0.0.1 -p 5433 premiser -U premiser_rds > premiser_prod_schema_dump-$(date -u "+%Y-%m-%dT%H:%M:%SZ").sql

# data only:
pg_dump --data-only --file=howdju.sql --host=127.0.0.1 --port=5433 --dbname=premiser --username=premiser_admin
