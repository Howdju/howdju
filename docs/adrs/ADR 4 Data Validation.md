# ADR 4 Data Validation

> NOTE: this ADR is not ready to publish; it has been moved to a [design
> doc](https://docs.google.com/document/d/1fblOR5k75XDWaTkRkZ3ul_3VSskoSa8hM4ymcItrIYY/edit#) for
> refinement.

A summary of the current planned guidance is below.

## Goals

The primary goal of our data validation is: to consolidate client- and server-side validation logic
as much as reasonable. This consolidation allows us to display errors and prevent data submission
client-side without an API call using the same rules as the backend would use to validate the data.
Supporting client-based non-local (API-based) validation provides better UX (informing users of a
validation error before the user submits, expecting/hoping to complete the submission.)

Cross-platform interoperability is a secondary goal, since currently our entire ecosystem is
Javascript. But cross-platform interoperability will provide future flexibility if we incorporate
non-Javascript runtimes, such as Python lambdas for data inference.

## Requirements

The error format should be recursive so that we can pull a field off of the current level of error
object and pass it directly to the UI component responsible for displaying that field.

The validation must support both local (based on the data itself) and non-local (must consult a
database or API) validation.

## Details

New data validation should use Ajv.

Have ‘standard’ and ‘non-standard’ schemas. The standard schemas are for maximum compatibility and
will primarily be for client-side validation. The non-standard schemas are for validation that
requires server access (‘does the value conflict with a unique constraint in the database?’) We
could provide both server-side non-standard schemas and client-side non-standard schemas where the
server-side schemas could access the database directly, and the client-side could call an API.
(Possibly as we migrate towards microservices, the two should both call the same APIs, possibly at
different addresses.)

We can use ajv-merge-patch to create a single validation schema incorporating both standard and
non-standard keywords.

Can Ajv we avoid expensive (non-standard, API-based/database-based) validation if inexpensive (standard)
validation fails?

Our typing requires that Ajv schema references are absolute.
