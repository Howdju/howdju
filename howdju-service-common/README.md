# Howdju service common

This repo contains code shared by server-side processes.

## Development guidelines

* All new files must use TypeScript
* All new methods must use async/await instead of Promise.

### Service guidelines

* Services check authentication by translating an authToken into a userId
* When creating entities, services must re-use equivalent extant entities,
  including for related entities.

### DAO guidelines

* Create methods must return the created object using a `returning` clause.
* Read methods must return fully materialized entities: the immediate entity and its related entities.
* DAOs may only read their entity tables and relation tables if their entity
  owns the entity.
* To read other entities, DAOs must receive other entity DAOs and read them
  using their public methods.

#### Method naming

* Method names must include the returned entity name.

  * `createWritQuote`

* Read method names must describe their arguments

  * `readWritQuoteForId` (instead of `readWritQuote`): can omit `ForWritQuoteId` because it's implied.
  * `readWritQuoteEquivalentTo` (instead of `readEquivalentWritQuote`): can omit
     `EquivalentToWritQuote` because it's implied.
