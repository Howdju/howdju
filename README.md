# Howdju monorepo

This repository contains client and server code for the Howdju platform.

## Status

* [![CI](https://github.com/Howdju/howdju/actions/workflows/ci.yml/badge.svg?branch=master&event=push)](https://github.com/Howdju/howdju/actions/workflows/ci.yml)
* [![Deploy to preprod](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml/badge.svg?branch=master&event=workflow_run)](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml)

## Prerequisites

### Install node

Install node and yarn:

```shell
brew install nodenv
nodenv init
nodenv install 14.16.0
# Activates this node version just for this shell via an env. var
nodenv shell 14.16.0
npm install -g yarn
```

The correct node version automatically activates due to the `.node-version` file.

### Install dependencies

This project uses Yarn workspaces to allow packages to depend on each other during development and to share
dependencies.

```shell
yarn install
```

### Password management

* Use a password manager.
* Memorize your: computer password, email password, and password manager password.
* Store all non-memorized passwords in your password manager.
* Never write down or persist a non-encrypted password. Passwords are either memorized or stored in the password
  manager.
* Use memorable diceware-style passwords: password managers like 1Password will autogenerate passwords like
  `lingua-GARDENIA-concur-softly`, which are easy to type (for managed passwords, if you can't copy-paste for some
  reason) and can be easy to remember, if you make up an image or story that goes along with the password. So, for this
  example password, you might imagine a tongue licking a gardenia flower, agreeing with it with a soft whispering
  voice. (See [XKCD](https://xkcd.com/936/).) It's important that you allow a professional password manager
  auto-generate these phrases, and that you not iterate through multiple choices to select one that is easy to remember,
  as this decreases the effective search space of the generated passwords. Instead, come up with a mental image to help
  you remember the words. The more silly or ridiculous, the easier it may be to remember.
* Enable two-factor auth for all accounts that support it. Use a virtual MFA like Authy or Microsoft Authenticator.

### Install `aws-vault`

[`aws-vault`](https://github.com/99designs/aws-vault/) allows securely storing and accessing AWS credentials in a
development environment.  You'll need an AWS admin to provide your AWS username, access key, and secret access key.

```shell
brew install --cask aws-vault
aws-vault add username@howdju
```

Update `~/.aws/config`:

```ini
[default]
region = us-east-1

[profile username@howdju]
mfa_serial = arn:aws:iam::007899441171:mfa/username
```

#### Running commands using aws-vault

Logging in:

```shell
aws-vault login username@howdju --duration 2h
```

Running commands with your credentials:

```shell
aws-vault exec username@howdju -- terraform apply
```

See `aws-vault`'s [USAGE](https://github.com/99designs/aws-vault/blob/master/USAGE.md) page for more.

### SSH access

Upload your public key named like `username.pub` to `s3://howdju-bastion-logs/public-keys/`. (The username for the
bastion host need not match your AWS username, but it should for simplicity.) The bastion host refreshes
from these every 5 minutes.

Generate a new SSH key:

```shell
ssh-keygen -t ed25519 -C "username@howdju.com"
```

Update `~/.ssh/config`:

```ssh
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519

Host bastion.howdju.com
  User username
```

### Prepare a local database server

TODO(#54): update this process to use a snapshot file.

```shell
cd premiser-api
yarn run db:tunnel

# in another terminal:
pg_dump_file_name=premiser_preprod_dump-$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql
pg_dump -h 127.0.0.1 -p 5433 howdju_pre_prod -U premiser_rds > $pg_dump_file_name
# you can kill `yarn run db:tunnel` once this completes

# In any available terminal (fill in a password for the postgres user):
printf 'Enter Postgres superuser password:'; read -s POSTGRES_SUPERUSER_PASSWORD
docker run -d -p 5432:5432 --name premiser_postgres -e POSTGRES_PASSWORD=$POSTGRES_SUPERUSER_PASSWORD postgres:12.5

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

## Running the platform locally

Do each of the following in different terminal windows.

### Run and connect to the database

```shell
docker restart premiser_postgres
yarn run db:local:shell
```

### Running the API

```shell
yarn run start:api:local
```

### Run the web app

```shell
yarn run start:ui:local
```

### Visit the app

Open browser to localhost:3000

## Automatic code checks

The most precise way to run automated checks is to run the
Github premerge action. See [Testing Github actions](#testing-github-actions)
below.

You can also run `yarn run check:everything`.

## Development

### Git branch workflow

#### Basic feature workflow

```bash
# Start from the main branch
git checkout master
# Updates should always be fast-forwards because we enforce linear history.
git pull --ff-only
# Always develop on a branch. We prefix all development branches with `features/n-` where `n` is the
# number of the bug corresponding to your work. We strongly encourage creating bugs for any work.
gco -b features/n-feature-slug
# Make your changes and commit
git commit
# ...more commits...
git push --set-upstream origin <branchName>
# Visit link output by push command to open a PR
```

We enforce 'squash and merge' for our PRs so that we have a linear history and
so that mainline commits are easier to scan.

#### Working on top of a PR branch

Often you'll want to build on top of changes that are in a PR. This is fine, but
requires some additional steps.

```bash
# Assuming that HEAD is your PR branch

# Make sure you start a new branch.
gco -b features/n-feature-slug

# ...commit changes...

# You can push your changes and start a PR, but I think it won't be mergeable
# until you rebase onto master. You should select the previous feature /
# parent PR branch as the new PR's base branch.

# To prepare your branch for merging, rebase onto master:
# git rebase --onto master parentCommitExclusive branchName
git rebase --onto master <previousFeatureBranch> <currentFeatureBranch>

git push -f
```

#### Editing a PR that you are also working on top of

In order to respond to PR comments with edits for a PR you are working on top of, you'll need an
interactive rebase.

```bash
git rebase -i HEAD~n

# Make changes

# Either amend the commit
git commit --amend --no-edit
# or add new commits
git commit

# Update the PR branch to be the new commit
git branch -f <branch-name> HEAD

# Update the PR branch
git push -f

git rebase --continue
```

where `HEAD~n` corresponds to the parent of the the commit you want to amend.

### Upgrading dependencies

```shell
yarn upgrade-interactive
```

### Doing something in each workspace

```shell
yarn workspaces foreach -Av exec bash -c 'yarn add --dev flow-bin'
```

### Adding a new lambda

```shell
lamdba_name=...
mkidr lambdas/$lambda_name
cp lambdas/howdju-message-handler/.eslintrc.js lambdas/$lambda_name
cp lambdas/howdju-message-handler/.gitignore lambdas/$lambda_name
cd lambdas/$lambda_name
npm init
yarn add --dev eslint eslint-config-howdju jest
```

Add commands: `build`, `clean`, `lint`, `release`, `test`.

## Publishing

Deployments are partially automated.

### API and web app

A Github action automatically deploys the API and web app to the preprod
environment.

After confirming that the preprod environment is valid, deploy the API and
web app to prod using the
[prod deployment Github Action](https://github.com/Howdju/howdju/actions/workflows/deploy-prod.yml).

### Publishing infrastructure changes

TODO(GH-46): give TerraformStateUpdater appropriate permissions

Request that your user get access to the role `TerraformStateUpdater`. Add a section to `~/.aws/config` for the role:

```ini
[profile terraform@howdju]
source_profile = username@howdju
role_arn = arn:aws:iam::007899441171:role/TerraformStateUpdater
```

Then run terraform commands using the role:

```shell
aws-vault exec terraform@howdju -- terraform plan
```

### Publishing database changes (migrations)

```shell
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

## Debugging

### Debugging/inspecting the API

```shell
cd premiser-api
yarn run start:local:inspect
```

Open Chrome to `chrome://inspect`.  Click "Open dedicated DevTools for Node".  The Chrome debugger should automatically
connect to the node process.  The Chrome debugger should automatically reconnect whenever the API restarts.

### Debugging/inspecting the UI

Use your web browser's Javascript debugging features as usual.

## Updating Yarn

```sh
yarn set version stable
```

## Testing Github actions

Install nektos/act:

```sh
brew install act
```

To test the `push` workflows:

```sh
act
```

To test the deployment:

```sh
act workflow_run\
 -e .github/workflows/test-deploy-event.json\
 -s AWS_ACCESS_KEY_ID\
 -s AWS_SECRET_ACCESS_KEY
```

See
[here](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run)
for the possible contents of the JSON file.
