# Source-based AJV validation

Some JavaScript execution contexts do not allow dynamic code evaluation. (E.g., browser extensions.)
Those contexts will error if we try to construct the Ajv instance
([details](https://ajv.js.org/security.html#content-security-policy)).

So we actually construct the source-based Ajv in this package so that code running in restricted
contexts can still import howdju-common.
