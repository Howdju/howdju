# Development documentation

This page describes how to setup a local environment for development and how to perform common
development tasks.

## CI/CD status

- [![CI](https://github.com/Howdju/howdju/actions/workflows/ci.yml/badge.svg?branch=master&event=push)](https://github.com/Howdju/howdju/actions/workflows/ci.yml)
- [![Deploy to preprod](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml/badge.svg?branch=master&event=workflow_run)](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml)

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

- Use a password manager.
- Memorize your: computer password, email password, and password manager password.
- Store all non-memorized passwords in your password manager.
- Never write down or persist a non-encrypted password. Passwords are either memorized or stored in the password
  manager.
- Use memorable diceware-style passwords: password managers like 1Password will autogenerate passwords like
  `lingua-GARDENIA-concur-softly`, which are easy to type (for managed passwords, if you can't copy-paste for some
  reason) and can be easy to remember, if you make up an image or story that goes along with the password. So, for this
  example password, you might imagine a tongue licking a gardenia flower, agreeing with it with a soft whispering
  voice. (See [XKCD](https://xkcd.com/936/).) It's important that you allow a professional password manager
  auto-generate these phrases, and that you not iterate through multiple choices to select one that is easy to remember,
  as this decreases the effective search space of the generated passwords. Instead, come up with a mental image to help
  you remember the words. The more silly or ridiculous, the easier it may be to remember.
- Enable two-factor auth for all accounts that support it. Use a virtual MFA like Authy or Microsoft Authenticator.

### Install `aws-vault`

[`aws-vault`](https://github.com/99designs/aws-vault/) allows securely storing and accessing AWS credentials in a
development environment. You'll need an AWS admin to provide your AWS username, access key, and secret access key.

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

### DCO commits

As explained in our CONTRIBUTORS guide, all code contributions must include a
certification of the ["Developer Certificate of
Origin"](https://developercertificate.org/). Our PR checks will fail if you
forget to do so. You can do this by adding the `--signoff` flag to your commits. Please
note that adding this flag to your commits and contributing them to Howdju
indicates a legal certification on your part. Refer to our CONTRIBUTORS guide
for details.

You can amend an existing commit to have the DCO like:

```sh
git commit --amend --no-edit -signoff
```

You can amend multiple parent commits to have the DCO like:

```sh
git rebase --signoff <mergeBaseSha>
```

Where `<mergeBaseSha>` must be the _parent_ of the first commit in your chain of commits.

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
git commit -s
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

git fetch origin master:master

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
git commit -s --amend --no-edit
# or add new commits
git commit -s

# Update the PR branch to be the new commit
git branch -f <branch-name> HEAD

# Update the PR branch
git push -f

git rebase --continue
```

where `HEAD~n` corresponds to the parent of the the commit you want to amend.

#### Culprit finding

```sh
git bisect start features/better-eslint master --
git bisect run sh -c "yarn && cd howdju-common && yarn run custom-check && yarn run test"
# command above will output the culprit commit
git bisect reset
```

### Upgrading dependencies

```shell
# Figure out why something is installed
yarn why -R <package>
# UI for upgrading
yarn upgrade-interactive
```

### Doing something in each workspace

```shell
yarn workspaces foreach -Av exec bash -c '[[ -f jest.config.ts ]] && yarn add --dev ts-node'
```

### Branching a dependency

If we need to modify a dependency: fork it, clone it locally, link it locally, and then
create the fix.

This command will link the project of the CWD to the local clone. (I think the resolutions field it
adds to the workspace root apply the link to all packages in the monorepo, so it's not necessary to
link from each package, unless the dependency was installed in the package-local `node_modules` for
some reason.)

```sh
yarn link ../../zod
```

We can ignore the resolutions added to the workspace root `package.json` (don't commit it, or at
least don't merge it, since the remote will not have access to the local clone.)

After creating the fix: commit, push, and open a PR. To get our app to work, we depend on our fork
until our PR is merged.

```sh
# Get the Git commit SHA-1 for the fix in our fork:
git rev-parse HEAD
# Depend on a commit from our fork. Use the commit hash from above
yarn add 'zod@github:Howdju/zod#ff9c65e456cf80b23b881ed2e1247f14337260ec'
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

Open Chrome to `chrome://inspect`. Click "Open dedicated DevTools for Node". The Chrome debugger should automatically
connect to the node process. The Chrome debugger should automatically reconnect whenever the API restarts.

### Debugging/inspecting the UI

Use your web browser's Javascript debugging features as usual.

## Updating Yarn

```sh
yarn set version stable
```

## Testing

We prefer testing code integrations early. This is related to the idea of the [testing
trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications). So instead of
mocking all code that is not part of the 'unit under test', consider if you can easily include real
dependencies in your tests. Doing so has these benefits:

- Discover integration failures earlier
- Avoid maintenance costs associated with updating mock behavior to match the real dependency

Consider only mocking dependencies that introduce:

- Unacceptable resource usage that slows down tests
- Unreliability or unpredictability
- Compexity in test environment setup that isn't outweighed by the additional test coverage.

### Types of tests

### Unit tests

Appropriate for code that isn't UI code and that doesn't persist data in the database.

### UI integration and snapshot tests

Features:

- Mock Service Worker to fake the API
- Helpers for rendering the React component under test with `redux` and `react-navigation` providers
  (`renderWithProviders`)
- React Testing Library for user-like high level interactions with page.

`premiser-ui/src/pages/registration/RegistrationConfirmationPage.test.tsx` is a good example.

### Service integration tests

Including infra for creating an initialized hermetic Postgres database using Docker (`testUtil.initDb`).

`howdju-service-common/lib/services/JustificationsService.test.ts` is a good example.

### Inspecting coverage for one package

```sh
yarn run test --coverage && open coverage/html/index.html
```

### Debugging UI tests

`@testing-library` provides these helpers:

```typescript
// Log the document
screen.debug();
// Log container without truncating
screen.debug(container, Number.MAX_SAFE_INTEGER);
// Output a URL that let's you inspect the DOM using a third-party website.
screen.logTestingPlaygroundURL();
```

### Snapshot tests

To regenerate snapshots, run Jest with `--updateSnapshot` and optionally `--testNamePattern`
([https://jestjs.io/docs/snapshot-testing#updating-snapshots](https://jestjs.io/docs/snapshot-testing#updating-snapshots)).
Packages should define a `test-update-snapshot` script for this. There is also an [interactive
mode](https://jestjs.io/docs/snapshot-testing#interactive-snapshot-mode) for updating snapshots.

To construct an exact pattern for a test, replace the arrow in the test name with a single space.
For example, a test named like `RegistrationConfirmationPage › shows form` would be:

```sh
yarn run test-update-snapshot "RegistrationConfirmationPage shows form"
```

There is an annoying flake with these tests that often manifests when they are run filtered to just
one test: the react-md animations do not complete and we end up with extraneous diffs like:

```diff
<div
  class="md-ink-container"
- >
-   <span
-     class="md-ink md-ink--active md-ink--expanded"
-     style="left: 0px; top: 0px; height: 0px; width: 0px;"
-   />
- </div>
+ />
```

To deal with this, use `git add -p` to selectively stage only the relevant changes. (If you end up
editing the file manually, you may benefit from this command too: `git restore path/to/file` which
removes unstaged changes while keeping staged changes.)

### Testing Github actions

Warning: Act currently fails for tests that use our Postgres docker because Act doesn't support Github
actions services. ([issue](https://github.com/nektos/act/issues/173)). We might be able to work
around this by detecting Act (I think it adds an env. var. `ACT`) and running the Postgres docker
like we do with local runs, but that sort of defeats the purpose of act.

Install nektos/act:

```sh
brew install act
```

To test the `push` workflows:

```sh
act --secret-file env/act-secrets.env
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

## Config structure

### ESLint

Each workspce must define a script `lint` like:

```sh
eslint --ignore-path=.gitignore .
```

For information about configuring linting, see eslint-config-howdju/README.md.

### Prettier

Each workspace must install the `--exact` same version of `prettier` and define a script `check-format`
that calls `prettier` like:

```sh
yarn run prettier --check --ignore-path .gitignore .
```

Each workspace must have a `.prettierrc` containing an empty JSON object (`{}`).

Each of our configs in `eslint-config-howdju` extends `prettier` as the last extended config so that it can override
any previous configs. If a package extends a config other than one of these, it must also be sure to
extend `prettier` as the last overridden config.

### TypeScript

Base config `tsconfig.json` in workspace root and packages extend it like:

```json
{
  "extends": "../tsconfig.json",
  // ...
  "compilerOptions": {
    // ...
    "paths": {
      // Support project-relative imports
      "@/*": ["./src/*"]
    }
  }
}
```

### Babel

`babel.config.js` in workspace root and `.babelrc.js` in packages to override.

### Jest

Base config exporting the config object and packages must define their own `jest.config.js` that
merges any customizations with the base. Preferably with `lodash`'s `merge` so that the merge is recursive.

```ts
import type { Config } from "jest";
import { merge } from "lodash";

import baseConfig from "../jest.config.base";

const config: Config = {
  // per-package customizations
};

export default merge(baseConfig, config);
```
