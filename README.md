# Prerequisites

## Install node

Install node and yarn:

```sh
brew install nodenv
nodenv init
nodenv install 8.10.0
# Activates this node version just for this shell via an env. var
nodenv shell 8.10.0
npm install -g yarn
# I had to install this to succeesfully install bcrypt in howdju-service-common
npm install -g node-gyp
```

The correct node version is automatically activated when you `cd` into a node.js directory containg a `.node-version` file.

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
# you can kill `yarn run db:tunnel`
docker run -p 5432:5432 postgres:9.6 --name premiser_postgres
# in another terminal:
psql -h localhost -U postgres < db/create-users.sql
echo 'create database premiser;' | psql -h localhost -U postgres
psql -h localhost -U postgres premiser < db/migrations/0000_db-users-privileges.sql
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

# Publishing

## Publishing the API

```sh
$ Build the base docker image (if necessary)
bin/docker/api-base-build.sh

# Build the docker image (if necessary)
bin/docker/api-deploy-build.sh

# Pulls and deploys the current master branch to pre-prod
bin/docker/api-deploy-run.sh pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

# To deploy to prod, just point the `prod` alias to the same version as the `pre-prod` alias
cd premiser-api/
yarn run update-lambda-function-alias --aliasName prod --newTarget pre-prod
```

## Publishing the web app
```sh
yarn run deploy:pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

yarn run deploy:prod
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
