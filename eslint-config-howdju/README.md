# eslint-config-howdju

Contains shared ESLint config for the project. This package is linked into all our packages
so that we can use it like:

```js
module.exports = {
  extends: ["howdju", "howdju/node"],
};
```

I wanted to auto-include `"howdju"` in both `"howdju/node"` and `"howdju/react"`, but I couldn't figure out how.

The contents of `index.js` could also have been a root `.eslintrc.js` file.

We cannot put all our shared config into a workspace root `.eslintrc.js` because we have no way to
differentiate between some contexts: a `.ts` file may require a `node` or `dom` context depending on
the project and/or path, and a root `.eslintrc.js` has no way to differentiate (without being
configured with paths from packages, which violates encapsulation.)

We use eslint-config-prettier to disable rules that conflict with prettier per https://prettier.io/docs/en/integrating-with-linters.html

If a package uses `howdju/node`, then it can use the same ESLint config for both its primary and
build contents:

```js
module.exports = {
  overrides: [
    {
      files: ["**/*.{js,ts}"],
      excludedFiles: ["node_modules/**"],
      extends: ["howdju/node"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
```

Otherwise, the primary and build contents require separate config:

```js
module.exports = {
  overrides: [
    {
      files: ["lib/**/*.{js,ts}"],
      extends: ["howdju/common"],
    },
    {
      // Everything else that isn't part of the library
      files: ["**/*.{js,ts}"],
      excludedFiles: ["lib/**", "node_modules/**"],
      extends: ["howdju/node"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
```

## Typescript linting for monorepos

https://typescript-eslint.io/linting/typed-linting/monorepos/
