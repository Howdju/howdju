# eslint-config-howdju

Contains shared ESLint config for the project. This package is linked into all our packages
so that we can use it lik:

```js
module.exports = {
  extends: [
    "howdju",
    "howdju/node",
  ],
};
```

I wanted to auto-include `"howdju"` in both `"howdju/node"` and `"howdju/react"`, but I couldn't figure out how.

The contents of `index.js` could also have been a root `.eslintrc.js` file.
