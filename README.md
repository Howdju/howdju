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
# (Since we replaced bcrypt with bcryptjs, we can probably remove this now.)
#npm install -g node-gyp
```

The correct node version automatically activates due to the `.node-version` file.

## Install dependencies

This project uses Yarn workspaces to allow packages to depend on each other during development and to share
dependencies.

```
yarn install
``` 

## Install `aws-vault`


[`aws-vault`](https://github.com/99designs/aws-vault/) allows securely storing and accessing AWS credentials in a
development environment.  You'll need an AWS admin to provide your AWS username, access key, and secret access key.

```sh
brew install --cask aws-vault
aws-vault add username@howdju
```

Update `~/.aws/config`:

```ini
[default]
region = us-east-1

[profile username@howdju]
mfa_serial = arn:aws:iam::007899441171:mfa/username

[profile terraform@howdju]
source_profile = username@howdju
role_arn = arn:aws:iam::007899441171:role/TerraformStateUpdater
```

### Running commands using aws-vault

Logging in:

```shell
aws-vault login username@howdju --duration 2h
```

Running commands with your credentials:

```
aws-vault exec username@howdju -- terraform apply
```

See `aws-vault`'s [USAGE](https://github.com/99designs/aws-vault/blob/master/USAGE.md) page for more.

## SSH access

Upload your public key named like `username.pub` to `s3://howdju-bastion-logs/public-keys/`. (The username for the
bastion host need not match your AWS username, but it should for simplicity.) The bastion host refreshes
from these every 5 minutes.

Generate a new SSH key:

```
ssh-keygen -t ed25519 -C "username@howdju.com"
```

Update `~/.ssh/config`:

```
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519

Host bastion.howdju.com
  User username
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
yarn run db:local:shell
```

## Running the API
```sh
yarn run start:api:local
```

## Run the web app
```sh
yarn run start:ui:local
```

## Visit the app

Open browser to localhost:3000

# Linting and testing

```sh
yarn run lint:all
yarn run test:all
```

# Doing something in each workspace

```sh
yarn workspaces foreach -Av exec bash -c 'yarn add --dev flow-bin'
```

# Publishing

## Publishing the API

```sh
cd premiser-api/
AWS_PROFILE=premiser yarn run deploy:api pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

# To deploy to prod, just point the `prod` alias to the same version as the `pre-prod` alias
AWS_PROFILE=premiser yarn run update-lambda-function-alias --aliasName prod --newTarget pre-prod
```

### Publishing a feature branch

I think just check out that branch and follow instructions above.

## Publishing the web app
```sh
yarn run deploy:ui:pre-prod

# (Visit pre-prod-www.howdju.com and test the changes)

yarn run deploy:ui:prod
```

## Publishing database changes (migrations)

```sh
cd premiser-api
yarn run db:tunnel

# In different tab
yarn run db:tunnel:shell:pre-prod
howdju_pre_prod> \i db/migrations/xxxx_the_migration.sql
howdju_pre_prod> exit

# (Visit pre-prod-www.howdju.com and test the changes)

# apply the migration to prod:
yarn run db:tunnel:shell:prod
howdju_prod> \i db/migrations/xxxx_the_migration.sql
howdju_prod> exit
```

# Debugging

## Debugging/inspecting the API

```sh
cd premiser-api
yarn run start:local:inspect
```

Open Chrome to `chrome://inspect`.  Click "Open dedicated DevTools for Node".  The Chrome debugger should automatically
connect to the node process.  The Chrome debugger should automatically reconnect whenever the API restarts.

## Debugging/inspecting the UI

Use your web browser's Javascript debugging features as usual.

## Adding a new lambda

```sh
lamdba_name=...
mkidr lambdas/$lambda_name
cp lambdas/howdju-message-handler/.eslintrc.js lambdas/$lambda_name
cp lambdas/howdju-message-handler/.gitignore lambdas/$lambda_name
cd lambdas/$lambda_name
npm init
yarn add --dev eslint eslint-config-howdju jest
```

Add commands: `build`, `clean`, `lint`, `release`, `test`.
