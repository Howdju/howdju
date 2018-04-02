# Prerequisites

Install npm (via nvm) and yarn:

```sh
curl -sS -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 6.10.3
npm install -g yarn
```

# Running

## Running the web app
```sh
cd premiser-ui
yarn install
yarn run local
```

## Running the API
```sh
cd premiser-api
yarn install
# TODO need to install a SQL database and run migrations.
yarn run db:local > premiser-db.out &
yarn run local
```

# Publishing

## Publishing the web app
```sh
yarn run deploy:pre-prod

# (Test pre-prod-www.howdju.com)

yarn run deploy:prod
```

## Publishing the API

```sh
# Build the docker image (if necessary)
bin/docker/api.deploy-build.sh

# Pulls and deploys the current master branch to pre-prod
bin/docker/api.deploy-run.sh pre-prod

# (Test pre-prod-www.howdju.com)

# To deploy to prod, just update the `prod` alias to the same version as pre-prod
cd premiser-api/
yarn run update-lambda-function-alias --aliasName prod --newTarget pre-prod
```
