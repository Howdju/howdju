# Type Design

`Entity`: domain concepts that have a unique identity. These are interfaces
that extend `Entity`. Their `id` is optional because they may not have been
persisted yet. Fields that are required for persistence are required on these.

`Persisted<Entity>`: Once an entity is persisted, it has been assigned a
database identiier. Its fields are now optional, because we may be passing
around just a reference to the ID.

`FormInputModel`: These represent entities we are editing in a form. If they
have any fields that are alternative types, they will have all of the alternatives
at once. The alternatives must be translated to a single entity prior to API
submission.

`FormSubmissiontModel`: An entity we have edited and are ready to submit. The
alternative types have been consolidated to select just one entity. They differ
from the `Entity` because some related entities may be `Persisted` since we
only need to refer to them by `id` to create a relation with them.

`ViewModel`: these are either UI specific models or extensions to entities that
contain additional useful fields for displaying the entity to a user. They
may contain Tags or Votes that are tailored to the viewing user.
