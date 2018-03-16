# Running

## Running the web app
```sh
cd premiser-ui
yarn run local
```

## Running the API
```sh
cd premiser-api
yarn run local
```

# Publishing

## Publishing the web app
```sh
yarn run deploy:pre-prod
# test pre-prod-www.howdju.com
yarn run deploy:prod
```

## Publishing the API

```sh
bin/docker/api.deploy-build.sh
# Deploys master branch to pre-prod
bin/docker/api.deploy-run.sh
# Test pre-prod-www.howdju.com
cd premiser-api/
# Point prod at the same version as pre-prod
yarn run update-lambda-function-alias -- --aliasName prod --newTarget pre-prod
```
