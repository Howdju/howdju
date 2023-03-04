# Howdju source code

This repository contains client and server code for the [Howdju](https://www.howdju.com) platform.

## Automation status

- [![CI](https://github.com/Howdju/howdju/actions/workflows/ci.yml/badge.svg?branch=master&event=push)](https://github.com/Howdju/howdju/actions/workflows/ci.yml)
- [![Deploy to preprod](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml/badge.svg?branch=master&event=workflow_run)](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml)

## Introduction

[Howdju](https://www.howdju.com) is a platform for analyzing and sharing critical analysis of
claims using evidence. The content is currently user-generated, and we hope to augment users'
actions with machine learning.

## Reporting issues

- [bugs](https://github.com/Howdju/howdju/labels/bug)

## Slack

You can [join our
Slack](https://join.slack.com/t/howdju/shared_invite/zt-1qbfzlfsj-YRswgQ5RCLDHelef6ya6xg) to discuss
Howdju with other useres and the site maintainers.

## Code history

The Howdju code base has undergone a few transformations, and since it is currently a prototype for
exploring features, we have not thoroughly completed all refactorings/cleanups/migrations. This
section describes major in-progress projects to provide the context for inconsistencies you may find.

### TypeScript migration

The code base is a little over half TypeScript now and includes TypeScript examples for most major
components. See #1 for details on the initial migration effort and [issues in the `ts-migration`
label](https://github.com/Howdju/howdju/labels/ts-migration) for substantial planned effort.

### Zod validation

All of Howdju's entities are defined using [Zod](https://zod.dev/). Zod is also our preferred
validation library. See #26 for the status of migrating previous data validation definitions to Zod.

### UI Framework

The web app currently uses react-md@1. Besides being outdated, we would like to explore a UI
framework that supports both react-native mobile and web. This cross-platform support would enable reusing
components on both webpages and mobile app screens.

See [#304](https://github.com/Howdju/howdju/issues/304).

### Premiser name

We initially considered Premiser as a name for Howdju, and so some packages have this name. Howdju
is now the preferred name.

## Contributing guide

If you'd like to contribute to Howdju, great! Please feel free to join our Slack to introduce
yourself and chat about what interests you. If you're specifically interested in contributing code
changes to Howdju's source code or issues to this repository, please see our [Contributor guidelines](https://github.com/Howdju/howdju/blob/master/CONTRIBUTING.md).

## Code layout

This repository is a monorepo based on Yarn berry workspaces. This diagram shows the high level
dependencies between the packages:

![package dependency diagram](https://raw.githubusercontent.com/Howdju/howdju/master/docs/diagrams/Howdju%20Monorepo%20Package%20Dependencies.drawio.png?token=GHSAT0AAAAAABYMGSPWSANRYRI5BMRJO35YZAAGEQA)

- `howdju-common`: code common to client and server runtimes. Any package can depend on this
  package. It includes:
  - Entity definitions
  - Validation
- `howdju-service-common`: code common to server runtimes. Most of our server-side business logic
  lives here including:
  - Services
  - Daos
- `howdju-service-routes`: strongly typed definitions of server-side routes. Used by both clients
  and services. Clients should only depend on the types and request schemas. Client builds must
  disallow dependencies on
- `premiser-api`: AWS lambda for API requests/responses. Initialization, gateway event handler, and
  logic is deferred to the selected route.
- `lambdas/howdju-message-handler`: SNS handler for async event handling.
- `howdju-client-common`: code common to clients.
- `premiser-ui`: React web app for howdju.com
- `premiser-ext`: Chrome web extension ([Chrome web store
  page](https://chrome.google.com/webstore/detail/howdju-extension/gijlmlebhfiglpgdlgphbmaamhkchoei/))
- `howdju-mobile-app`: React native mobile app.

Missing from the diagram are:

- `eslint-config-howdju`: shared ESLint config.
- `howdju-ajv-sourced`: deprecated package for AJV validation.
- `howdju-elastic`: docker image definitions for custom Elasticsearch/Kibana (currently inactive)
- `howdju-ops`: utilities for deploying and maintaining service operations.
- `howdju-test-common`: code shared between tests.
- `infra`: Terraform definitions for our cloud services.
- `premiser-migrate`: legacy one-time migration code from a previous persistence format.
- `premiser-processing`: legacy infra for two lambdas that execute on a schedule. New lambdas should
  follow the pattern of `lambdas/howdju-message-handler`.

## System architecture

The howdju.com web app consists of these parts:

- An HTML bootstrap page served from an S3 bucket which loads
- A single JS bundle served from Cloudfront that calls
- A monolithic AWS lambda behind AWS API Gateway.
- Persistance is in AWS RDS Postgres.

## Code architecture

The following sections briefly discuss the major components and dependencies of our clients and services.

### Web app

The web app uses react-navigation to select pages. The pages dispatch Redux actions handled by Redux
reducers and redux-saga (for asynchronous handling.) It calls the API using Axios. It normalizes entities using
normalizr.

### API

The API has bespoke request routing supporting strongly-typed routing in clients. The route handlers
should contain minimal logic and call Services to fulfill the request. Services contain our business
logic and call DAOs for persistence.

## Tests

Growing test coverage, including UI and Service/DB integration tests. See our [testing
section](https://github.com/Howdju/howdju/blob/master/docs/Development.md#testing) in the
development docs.

## Affiliations

Carl has been attending meetings semiregularly with the [Canonical Debate
Lab](https://canonicaldebatelab.com/), a lose assocation of people who are all interested in solving
similar problems (empowering collective intelligence) but with different focuses and approaches. If
Howdju sounds interesting to you, that group may also interest you.
