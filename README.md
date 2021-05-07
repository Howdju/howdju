# Prerequisites

## Install node

Install node and yarn:

```sh
brew install nodenv
nodenv init
nodenv install 14.16.0
# Activates this node version just for this shell via an env. var
nodenv shell 14.16.0
npm install -g yarn
# I had to install this to successfully install bcrypt in howdju-service-common
npm install -g node-gyp
```

The correct node version automatically activates due to the `.node-version` file.

## Link development node modules and install 

Linking the modules causes dependent modules to use the current code instead of a static installed dependency.

```
bin/link.sh
bin/install-all.sh
``` 

# Prepare a local database server

```
cd premiser-api
yarn run db:tunnel

# in another terminal:
pg_dump_file_name=premiser_prod_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
pg_dump -h 127.0.0.1  -p 5433 premiser -U premiser_rds > $pg_dump_file_name
# you can kill `yarn run db:tunnel` once this completes

# In any available terminal (fill in a password for the postgres user):
docker run -d -p 5432:5432 --name premiser_postgres -e POSTGRES_PASSWORD= postgres:12.5

# If you want to see the output from the db, either omit -d from the run command or run:
docker logs premiser_postgres --follow

# In any available terminal, run the following:

# Choose a premiser_api password and update the config/local*.env files
psql --echo-all -h localhost -U postgres < db/create-users.sql
echo 'create database premiser;' | psql -h localhost -U postgres
psql --echo-all -h localhost -U postgres premiser < db/migrations/0000_db-users-privileges.sql
psql -h localhost -U postgres --set ON_ERROR_STOP=on premiser < $pg_dump_file_name
rm $pg_dump_file_name
```

# Running the platform locally

Do each of the following in different terminal windows.

## Run and connect to the database 

```
docker restart premiser_postgres
cd premiser-api
yarn db:local:shell
```

## Running the API
```sh
cd premiser-api
yarn start:local
```

## Run the web app
```sh
cd premiser-ui
yarn start:local
```

## Visit the app

Open browser to localhost:3000

# Linting and testing

```
bin/lint-all.sh
bin/test-all.sh
```

# Publishing

## Publishing the API

```sh
cd premiser-api/
AWS_PROFILE=premiser bin/deploy.sh pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

# To deploy to prod, just point the `prod` alias to the same version as the `pre-prod` alias
AWS_PROFILE=premiser yarn run update-lambda-function-alias --aliasName prod --newTarget pre-prod
```

### Publishing a feature branch

I think just check out that branch and follow instructions above.

## Publishing the web app
```sh
yarn run deploy:pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

yarn run deploy:prod
```

## Publishing database changes (migrations)

```sh
cd premiser-api
yarn db:tunnel

# In different tab
yarn db:tunnel:shell:pre-prod
howdju_pre_prod> \i db/migrations/xxxx_the_migration.sql
howdju_pre_prod> exit

# (Visit pre-prod-www.howdju.com and test the changes)

# apply the migration to prod:
yarn db:tunnel:shell:prod
howdju_prod> \i db/migrations/xxxx_the_migration.sql
howdju_prod> exit
```

# Debugging

## Debugging/inspecting the API

```sh
cd premiser-api
yarn start:local:inspect
```

Open Chrome to `chrome://inspect`.  Click "Open dedicated DevTools for Node".  The Chrome debugger should automatically
connect to the node process.  The Chrome debugger should automatically reconnect whenever the API restarts.

## Debugging/inspecting the UI

Use your web browser's Javascript debugging features as usual.
