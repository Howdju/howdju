#! /bin/bash

set -e

docker run -p 5432:5432 postgres:9.6
psql -h localhost -U postgres < db/create-users.sql
echo 'create database premiser;' | psql -h localhost -U postgres
psql -h localhost -U postgres premiser < db/migrations/0000_db-users-privileges.sql
psql -h localhost -U postgres --set ON_ERROR_STOP=on premiser < premiser_prod_dump.sql
