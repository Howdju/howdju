# Howdju source code

This repository contains client and server code for the [Howdju](https://www.howdju.com) platform.
Learn more about the platform on [the docs site](https://docs.howdju.com).

## Automation status

- [![CI](https://github.com/Howdju/howdju/actions/workflows/ci.yml/badge.svg?branch=master&event=push)](https://github.com/Howdju/howdju/actions/workflows/ci.yml)
- [![Deploy to
preprod](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml/badge.svg?branch=master&event=workflow_run)](https://github.com/Howdju/howdju/actions/workflows/deploy-preprod.yml)

## Introduction

[Howdju](https://www.howdju.com) is a platform for analyzing and sharing critical analysis of claims
using evidence. The content is currently user-generated, and we hope to augment users' actions with
machine learning.

## Contributing

We welcome your contributions!

Please [join our
Slack](https://join.slack.com/t/howdju/shared_invite/zt-1qbfzlfsj-YRswgQ5RCLDHelef6ya6xg) to
introduce yourself and chat about what interests you. Before contributing please look over our
[Contributor Guidelines](https://github.com/Howdju/howdju/blob/master/CONTRIBUTING.md).

### Issues

Our [open issues](https://github.com/Howdju/howdju/issues) indicate the work we have identified.

Here are some focused ways to view issues:

- [Assigned to Carl](https://github.com/Howdju/howdju/issues/assigned/carlgieringer) these are
  issues I'm actively working on or that I intend to work on soon.
- [Enhancements](https://github.com/Howdju/howdju/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement):
  features on our road map (as opposed to bugs.)
- [Core domain](https://github.com/Howdju/howdju/labels/core%20domain): these are the work items
  that relate to Howdju‘s primary fact-checking functionality.
- [In the Add Appearances project](https://github.com/orgs/Howdju/projects/3): this is a Kanban
  board that contains similar issues to those assigned to Carl.
- [Good first issues](https://github.com/Howdju/howdju/labels/good%20first%20issue): Howdju welcomes
  contributions! Carl is happy to explain the platform and the development process to newcomers. I
  am also happy to talk through ideas for features and implementation approaches.

The current general direction is to evaluate and improve the social fact-checking functionality.

### Contribution guidelines

## Development

See [docs/Development.md](https://github.com/Howdju/howdju/blob/master/docs/Development.md) to get
setup for developing Howdju.

## Reporting issues

- [bugs](https://github.com/Howdju/howdju/labels/bug)

## Slack

You can [join our
Slack](https://join.slack.com/t/howdju/shared_invite/zt-1qbfzlfsj-YRswgQ5RCLDHelef6ya6xg) to discuss
Howdju with other users and the site maintainers.

## Code history

The Howdju code base has undergone a few transformations, and since it is currently a prototype for
exploring features, we have not thoroughly completed all refactorings/cleanups/migrations. This
section describes major in-progress projects to provide the context for inconsistencies you may
find.

### TypeScript migration

The code base is a little over half TypeScript now and includes TypeScript examples for most major
components. See Howdju/howdju#1 for details on the initial migration effort and [issues in the
`ts-migration` label](https://github.com/Howdju/howdju/labels/ts-migration) for substantial planned
effort.

### Zod validation

All of Howdju's entities are defined using [Zod](https://zod.dev/). Zod is also our preferred
validation library. See Howdju/howdju#26 for the status of migrating previous data validation
definitions to Zod.

### Justification types and evidence representation

Howdju's representation of `Justification`s and references to external sources has undergone some
evolution. This list represents the status of some relevant entities:

- `JustificationCompound`: deprecated. This entity represented mixing evidence and argument in the
  same justification. Now we require justifications to be either 'evidence-based'
  (`SourceExcerpt`-based) or 'argument-based' (`PropositionCompound`-based.)
- `SourceExcerptParaphrase`: deprecated. This entity represented a requirement that all evidence
  input to the system (`SourceExcerpt`s) had to come with the user's paraphrase of their meaning.
  Now we will instead use `SourceExcerpt`s two ways: they can be the basis of a justification, where
  they represent a user's intention to express the implication of the justification target based
  upon the evidence. Or they can be part of an appearance, where they represent a user's intention
  to express that a reasonable reader of the excerpt could conclude that it equated with an
  expression of the `Appearance`'s content (initially `Proposition`s.)
- `SourceExcerpt`: the preferred representation of evidence. (We might call this `MediaFragment`
  because the system need not contain an association between a `Source` and entered evidence.)
- `WritQuote`: a type of `SourceExcerpt`, along with `PicRegion` and `VidSegment`. In many places we
  assume that a `WritQuote` is the only type of `SourceExcerpt`, but we intend to generalize this.
  E.g., we will replace `WritQuote`-based `Justification`s with `SourceExcerpt`-based
  justifications.

### UI Framework

The web app currently uses react-md@1. Besides being outdated, we would like to explore a UI
framework that supports both react-native mobile and web. This cross-platform support would enable
reusing components on both webpages and mobile app screens.

See Howdju/howdju#304.

### Premiser name

We initially considered Premiser as a name for Howdju, and so some packages have this name. Howdju
is now the preferred name.

## Code layout

This repository is a monorepo based on Yarn berry workspaces. This diagram shows the high level
dependencies between the packages:

![package dependency
diagram](https://raw.githubusercontent.com/Howdju/howdju/master/docs/diagrams/Howdju%20Monorepo%20Package%20Dependencies.drawio.png?token=GHSAT0AAAAAABYMGSPWSANRYRI5BMRJO35YZAAGEQA)

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
- `howdju-client-common`: code common to clients. The decision to put code here can be based upon
  either runtime considerations (if putting the code in howdju-common would not work outside of a
  DOM runtime) or based upon design decisions (if it would never make sense to access the code in a
  server-side context.)
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

### Web app and lambda API

- An HTML bootstrap page served from an S3 bucket which loads
- A single JS bundle served from Cloudfront that calls
- A monolithic AWS lambda behind AWS API Gateway.
- Persistance is in AWS RDS Postgres.

### Message handler

- Howdju currently has a single SNS-based message handler. It is currently responsible for sending
  email notifications.

### Scheduled jobs

- Howdju has a few scheduled jobs that calculate aggregate scores on justifications.

## Code architecture

The following sections briefly discuss the major components and dependencies of our clients and
services.

### Web app

The web app uses react-navigation to select pages. The pages dispatch Redux actions handled by Redux
reducers and redux-saga (for asynchronous handling.) It calls the API using Axios. It normalizes
entities using normalizr.

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
Lab](https://canonicaldebatelab.com/), a loose assocation of people who are all interested in
solving similar problems (empowering collective intelligence) but with different focuses and
approaches. If Howdju sounds interesting to you, that group may also interest you.
