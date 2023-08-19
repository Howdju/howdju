# ADR 1 — Server-side style

This ADR provides high-level guidance for how to write and structure serverside
code.

## Development guidelines

- All new files must use TypeScript
- All new methods must use async/await instead of Promise.

### Service guidelines

- Services check authentication by translating an authToken into a userId
- When creating entities, services must re-use equivalent extant entities,
  including for related entities.
- Services should throw EntityNotFoundErrors for missing entities.

### DAO guidelines

- Create methods must return the created object using a `returning` clause.
- Read methods must return fully materialized entities: the immediate entity and its related entities.
- DAOs may only read their entity tables and relation tables if their entity
  owns the entity.
- To read other entities, DAOs must receive other entity DAOs and read them
  using their public methods.
- DAOs should implement filter/search methods by returning the IDs and then deferring to the
  readForIds method. This centralizes the logic of materializing the entity (and querying related entities.)
- DAOs should implement a readForId method in terms of a readForIds. Doing so is more efficient than
  the opposite (implementing readForIds in terms of readForId) because readForId requires a DB
  request round trip for each ID.
- Methods reading a single entity according to some identifier (ID, normalized name, etc.) should
  return undefined when the entity is missing.

### Services vs. DAOs

- As much as reasonable, we should read related entities in the service and compose the full
  materialized entity.

#### Method naming

- Method names must include the returned entity name.

  - `createWritQuote`

- Read method names must describe their arguments

  - `readWritQuoteForId` (instead of `readWritQuote`): can omit `ForWritQuoteId` because it's implied.
  - `readWritQuoteEquivalentTo` (instead of `readEquivalentWritQuote`): can omit
    `EquivalentToWritQuote` because it's implied.
