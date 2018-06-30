# Local run preparation

```
yarn run db:tunnel
pg_dump -h 127.0.0.1  -p 5433 premiser -U premiser_rds > premiser_prod_dump-20180629.sql

docker run -p 5432:5432 postgres:9.6
psql -h localhost -U postgres < db/create-users.sql
echo 'create database premiser;' | psql -h localhost -U postgres
psql -h localhost -U postgres premiser < db/migrations/0000_db-users-privileges.sql
psql -h localhost -U postgres --set ON_ERROR_STOP=on premiser < premiser_prod_dump-20180629.sql
```

```
./bin/link.sh
```

# Running locally

In one terminal:

```
docker run -p 5432:5432 postgres:9.6
```

In a second terminal:

```
cd premiser-api
yarn run local
```

In a third terminal:

```
cd premiser-ui
yarn run local
```

Open browser to localhost:3000