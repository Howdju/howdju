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

## Form models (`CreateXInput`/`EditXInput`)

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

## API request models (`CreateX`/`EditX`)

API request models are those that a client will send to an API as a request
payload. They are often entities that represent all the data the API needs to
persist the entity. Edit model alternatives must be consolidated into a single
choice on these models.

An entity may have several different corresponding API request models for
different use-cases, if different fields are required. An entity's API request
model may also refer to persisted related entities using only their `id` (i.e. `Ref`s.)

## `Persisted` entities

`Persisted<TEntity>`: Once an entity is persisted, it has been assigned a
database identiier. Its `id` is required, but its other fields are now optional,
because they are implied by the ID. We may be passing around just a reference to
the ID.

`Persisted` entities often appear on the relation fields of edit models or API
submisison models when they represent the creation of a newly related entity.

## `ViewModel`s

`ViewModel`s are either UI specific models or extensions to entities that
contain additional useful fields for displaying the entity to a user. They
may contain `Tag`s or `Vote`s that are tailored to the viewing user.

Entities appearing in ViewModels are always a persisted Entity. (Unpersisted Entities would be
`CreateModel`s.) We often also want their fields to be required for display.

`ViewModel`s are often returned directly from the API for a client to display,
although client may also augment a `ViewModel` after receiving it, or may
construct `ViewModel`s entirely for ephemeral client-side state.

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
| `EditXInput`   | Model for inputing an edit of an entity in a client.                            |
|                |
|                | These are usually less complicated than create models because there are         |
|                | fewer ways to edit an entity than to create it. Usually users can only edit     |
|                | the properties of an entity, not its relationships (although only under         |
|                | certain conditions.) Users must create new entities to have an entity with      |
|                | updated relationships.                                                          |
| `CreateX` /    | API Request models for sending the creation/edit of an entity to an API.        |
| `EditX`        |
|                | Alternatives from `CreateXInput` have been consolidated, but the model may      |
|                | still refer to related entities.                                                |
|                |
|                | These models must be validated before operating on them. Validation             |
|                | boundaries occur at the boundaries of ownership.                                |

## `mux...`/`demux...`

We have helpers prefixe with `mux` and `demux` for consolidating or expanding entity alternatives.

## Model locations

- howdju-common/lib/zodSchemas.ts

  Our entity validation schemas. Only things that must be validated should go here.

- howdju-common/lib/models.ts

  Factories and helpers for models that are re-used across any endpoint.

- howdju-common/lib/enums.ts

  Enums that are not derived from Zod schemas.

- howdju-common/lib/entities.ts
- howdju-client-common/lib/models.ts

  Models that are re-used across clients

- premiser-ui/src/viewModels.ts

  Models that are web app specific.
