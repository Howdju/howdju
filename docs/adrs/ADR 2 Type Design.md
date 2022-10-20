# ADR 2 — Entity and model type design

This ADR describes Entities and other major model types that we use throughout
the system.

## `Entity`s

Entities represent domain concepts with a unique identity. In a relational data
model, these usually correspond to rows with unique IDs in a table. The must
have an `id`, and it is optional because they might not be persisted yet.
Fields are required unless the entity can be valid without them.

## `EditModel`s

Versions of an entity suitable for editing, say using an HTML form.

The types must allow values for the fields that can occur in the editor. For example, if
a user could delete all of the characters from a text field, the model must
allow an empty string there, even if this it not a valid final state to submit
the entity.

If an editor would allow choosing between and editing alternative specializations
of a related field then the model must represent the alernatives simultaneously
so as not to discard intermediate edits. E.g. if a user edits a justification
basis proposition, and then switches between it and a different basis, the edits
from the proposition should not appear.

Practically speaking, it means that fields like:

```typescript
sourceExcerpt: {
  type: "WritQuote" | "PicRegion" | "VidSegment"
  entity: WritQuote | PicRegion | VidSegment
}
```

will have an edit model representation like:

```typescript
sourceExcerpt: {
  type: "WritQuote" | "PicRegion" | "VidSegment"
  writQuote: WritQuote
  picRegion: PicRegion
  vidSegment: VidSegment
}
```

Where the `type` indicates which of the alternatives the user selected.

## API `SubmissionModel`s

API submission models are those that a client will send to an API as a request
payload. They are often entities that represent all the data the API needs to
persist the entity. Edit model alternatives are often consolidated into a single
entity on these models.

An entity may have several different corresponding API submission models for
different use-cases, if different fields are required. An entity's API submission
model may also refer to persisted related entities using only their `id`.

Use `TSubmission = T & Related<T, "related1" | "related2">` to create a new submission
type where the fields `related1` and `related2` on `T` is `Persisted`.

## `Persisted` entities

`Persisted<Entity>`: Once an entity is persisted, it has been assigned a
database identiier. Its `id` is required, but its other fields are now optional,
because they are implied by the ID. We may be passing around just a reference to
the ID.

`Persisted` entities often appear on the relation fields of edit models or API
submisison models when they represent the creation of a newly related entity.

## `ViewModel`s

`ViewModel`s are either UI specific models or extensions to entities that
contain additional useful fields for displaying the entity to a user. They
may contain `Tag`s or `Vote`s that are tailored to the viewing user.

Entities appearing in ViewModels are always a persisted Entity. We often also want
their fields to be required for display. We use the helper
`Materialized\<TEntity>` to represent this.

`ViewModel`s are often returned directly from the API for a client to display,
although client may also augment a `ViewModel` after receiving it, or may
construct `ViewModel`s entirely for ephemeral client-side state.

## `Materialized` entities

Entities read from the database database are materialized, which means that they
contain both the Entity's `id` and full versions of many of the Entity's fields.
An Entity may be materialized in different ways for different purposes:

* Including related fields or not
* Including all fields or not.

## `FactoryInput`s

We use functions called factories to generate the objects corresponding to our
entities and models. Often these functions accept an object containing fields to
customize the generated object.

For `Entity` factories, it is often sufficient to accept a `Partial<TEntity>`
because any of the fields can be overridden, but none must be.

For submission models, we often want to transform an entity so that:

* some fieldsa are required,
* some other fields are required, but can represent a `Persisted` version of the
  related entity, and
* the remaining fields are optional

To support that, we have the `FactoryInput` helper:

```typescript
type FactoryInput<T, RequiredFields extends keyof T, RelatedFields extends keyof T>
```
