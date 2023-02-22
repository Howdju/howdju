# ADR 2 — Entity and model type design

This ADR describes Entities and other major model types that we use throughout
the system.

## `Entity`s

Entities represent domain concepts with a unique identity.

We define entities using Zod schemas. The entities are conceptually ideal, representing the
properties and relations between entities that are conceptually present. But in reality, we use
bespoke models to represent entities for specific purposes, such as:

- Data models for representing the data we persist (which may not match the entity precisely, e.g.
  we persist a justification's root target model because this makes it easy to select all the
  justifications related to a particular root target. (Although we could probably replace that with
  a join table to keep the justifications table conceptually pure, and remove the discrepancy
  between the Justification entity and data model.)
- View models which may contain additional information that is convenient for display. E.g., a
  Justification entity does not contain its counter justifications; instead, the counter
  justifications reference the justification they counter as a target. But it is convenient in the
  view to reference the counter justifications top-down on a property on the countered
  justification. Similarly with tags.
- Form input models
- API request models.

In a relational data model, entities roughly correspond to rows with unique IDs in a table. Entities
must have an `id`, but it is optional because they might not be persisted yet. Fields are required
unless the entity can be valid without them.

## Form models (`CreateXInput`/`UpdateXInput`)

Versions of an entity suitable for editing, say using an HTML form.

The types must allow values for the fields that can occur in the editor. For example, if
a user could delete all of the characters from a text field, the model must
allow an empty string there, even if this it not a valid final state to submit
the entity.

If an editor allows choosing between and editing alternative specializations
of a related field then the create model must represent the alernatives simultaneously
so as not to discard intermediate edits. E.g. if a user edits a justification
basis proposition, and then switches between it and a different basis, the edits
from the proposition should not appear.

Practically speaking, it means that fields like:

```typescript
sourceExcerpt:
  | {
    type: "WritQuote";
    entity: WritQuote;
  }
  | {
    type: "PicRegion";
    entity: PicRegion ;
  }
  | {
    type: "VidSegment";
    entity: VidSegment;
  }
```

will have an edit model representation like:

```typescript
sourceExcerpt: {
  type: "WritQuote" | "PicRegion" | "VidSegment";
  writQuote: WritQuote;
  picRegion: PicRegion;
  vidSegment: VidSegment;
}
```

Where the `type` indicates which of the alternatives the user actually wants persisted upon creation.

## In models (`CreateXIn`/`UpdateXIn`)

`In` models represent data a client sends to an API as a request
payload. They are often entities that represent all the data the API needs to
persist an entity. Update model alternatives must be consolidated into a single
choice on these models.

An entity may have several different corresponding API request models for
different use-cases, if different fields are required. An entity's API request
model may also refer to persisted related entities using only their `id` (i.e. `Ref`s.)

There probably is not a use for a `ReadXIn` model because the data we send to the API to read
entities often does not have the same shape as the entity. Instead we often send an entity ID along
with multiple query string parameters that control what we return. A better name might be `ReadXParams`.

## Out models (`XOut`/`CreateXOut`/`ReadXOut`/`UpdateXOut`)

`Out` models are usually those returned by ('coming out of') the API. They usually extend or modify
the entities upon which they are based, containing additional fields useful for displaying the
entity to a user. For example they may contain `Tag`s or `Vote`s that are tailored to the viewing
user.

Entities appearing in OutModels are usually a persisted Entity. (Unpersisted Entities would be
`CreateModel`s.) We often also want their fields to be required for display.

Additional fields on `Out` models are often optional, either:

1. To ease reuse of the `Out` model in different responses which may not include the extra fields,
   or
2. To support request parameters that control the addition of extra fields.

An entity/endpoint may have a generic `XOut` type, or it may specialize the out types per method,
like `CreateXOut`/`ReadXOut`/`UpdateXOut`.

### Out model relations

Every `Out` model must decide the status of its relations: will related entities be included on the
model, referenced by ID only, or a union of either? When a model will include a related entity, the
DAO must query those entities and attach them. If we move to a denormalized data model, then many of
the related entities (or part of them at least) should be denormalized to the main entity.

## Request/response models

We have no explicit models for requests/responses. Instead these are implied by the request schemas
and handler return type of the service routes.

## `Persisted` entities

`Persisted<TEntity>`: Once an entity is persisted, it has been assigned a
database identiier. Its `id` is required, but its other fields are now optional,
because they are implied by the ID. We may be passing around just a reference to
the ID.

`Persisted` entities often appear on the relation fields of edit models or API
submisison models when they represent the creation of a newly related entity.

## Persistence models (`XData`, `XRow`)

Persistence models represent actions and state of stored data. Actions on data are usually CRUD
(`CreateJustificationDataIn`, etc.) State of data corresponds to a single item from a table (`JustificationRow`.)

We may add additional relation fields that help
to query or index the data. Some Entities will not need a special persistence model, and so they can
use the entity model for persistence.

- `CreateEntityDataIn` a model for creating an entity (e.g., `CreateJustificationDataIn`). The return value will usually be the same as
  the read out model.
- `ReadEntityDataOut` a model for reading an entity (e.g., `ReadJustificationDataOut`). There may
  not be a corresponding `In` model, since often the parameters to a database read don't
  neatly map to the entity. The `ReadEntityDataOut` model differs from a `EntityRow` model in that
  the `DataOut` model will have had the fields transformed and may have materialized related entities.

## `View` models

The term `View` model is a catch-all for models used in clients that don't fall in any other category. Client
may also augment a `Out` model after receiving it, creating a `View` model, or may construct
`View` models entirely for ephemeral client-side state. `View` models may not necessarily be based
on an entity.

## Types table

| Name           | Meaning                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `X`            | Model for representing an entity.                                               |
|                |
|                | Used for representing an entity server- and client-side and returning an entity |
|                | from the API                                                                    |
|                |
|                | These models do not require validation since they either come from the database |
|                | or do not represent modifications to the system..                               |
| `CreateXInput` | Model for inputing the creation of an entity in a client.                       |
|                |                                                                                 |
|                | These are usually more complicated than edit models because users               |
|                | can select from among any of an entity's possibilities when creating them.      |
|                | Submitting these is also the most complicated on backends because we offer      |
|                | a permissive submission data model: users can either create new related         |
|                | entities, reference existing ones by ID, or reference equivalent ones           |
|                | incidentally.                                                                   |
| `UpdateXInput` | Model for inputing an edit of an entity in a client.                            |
|                |
|                | These are usually less complicated than create models because there are         |
|                | fewer ways to edit an entity than to create it. Usually users can only edit     |
|                | the properties of an entity, not its relationships (although only under         |
|                | certain conditions.) Users must create new entities to have an entity with      |
|                | updated relationships.                                                          |
| `CreateX` /    | API Request models for sending the creation/edit of an entity to an API.        |
| `UpdateX`      |
|                | Alternatives from `CreateXInput` have been consolidated, but the model may      |
|                | still refer to related entities.                                                |
|                |
|                | These models must be validated before operating on them. Validation             |
|                | boundaries occur at the boundaries of ownership.                                |
| `XData`        | Persistence model for `X`.                                                      |
| `XOut`         | Model returned by API representing the entity `X` and possibly additional info. |
| `YView`        | A view model for `Y` (where `Y` may not be an entity.)                          |

## Validation

Not all models need to be validated in production. Generally, models representing user input must be
validated, while data coming from our persistence or API logic does not require production
validation. But it may be worthwhile to validate outgoing models in development.

## `mux...`/`demux...`

We have helpers prefixe with `mux` and `demux` for consolidating or expanding entity alternatives.

## Model locations

- howdju-common/lib/zodSchemas.ts

  Our entity definitions.

- howdju-common/lib/apiModels.ts

  Models relating to API input/output

- howdju-common/lib/models.ts

  Factories and helpers for models that are re-used across any endpoint.

- howdju-common/lib/enums.ts

  Enums that are not derived from Zod schemas.

- howdju-common/lib/entities.ts
- howdju-client-common/lib/models.ts

  Models that are re-used across clients

- premiser-ui/src/viewModels.ts

  Models that are web app specific.

- howdju-service-common/lib/daos/dataTypes.ts

Data persistence specific models. Rows correspond to database rows, and Data models correspond to
models that go in/out of DAO methods.
