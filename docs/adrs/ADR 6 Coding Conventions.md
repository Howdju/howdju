# ADR 6 Coding Conventions

## Don't use `null`. Only use `undefined`

I haven't seen a need for both. We can use `"prop" in obj` to check if something is present, and
TypeScript doesn't let you do things like `if (obj.maybePresentProp)` unless `maybePresentProp`
can be undefined.

The TypeScript team
[appears to follow this
convention](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#null-and-undefined)
as well.

## String enum values use SCREAMING_SNAKE_CASE

E.g. polarities are `"POSITIVE"` and `"NEGATIVE"`.

This is what we chose awhile ago.
