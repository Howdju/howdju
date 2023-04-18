# Howdju web app (`premiser-ui`)

This is the yarn workspace for Howdju's web app.

## Hot module reload

I think that I initially followed these instructions:

- [react-hot-loader docs for webpack2](https://github.com/gaearon/react-hot-loader/tree/a03dde0c1833105abf0555e2a3028572bd15493c/docs#webpack-2)
  (I think this is why I had `["es2015", { "modules": false }]` in my code.)
- and http://gaearon.github.io/react-hot-loader/getstarted/

I think I'll just update this approach, following:

- [these instructions](https://github.com/gaearon/react-hot-loader/tree/6032f4255e0268bb794c1e9b8ae5b436400ffbb5#getting-started).
- Summarized in [this comment](https://github.com/gaearon/react-hot-loader/issues/1227#issuecomment-482518698)

Even though the
[recommendation](https://github.com/gaearon/react-hot-loader/tree/6032f4255e0268bb794c1e9b8ae5b436400ffbb5#moving-towards-next-step)
is to move on to Fast Refresh using
[react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin/).

I did:

- `yarn add react-dom@npm:@hot-loader/react-dom@16.14.0` to stay at react-dom@16.

But then I discovered that iframe.onLoad wasn't working in local development (used by extension), and I suspected the
hot loaders interaction with react-dom, so I just switched to `yarn add 'react-dom@^16.2.0'`

## react-md

This workspace currently depends on a patch of @react-md/autocomplete@2.9.1 that adds
`event.preventDefault()` when the user presses enter to autocomplete. This change prevents
submitting a form when the user is autocompleting.

PR for that change is here: https://github.com/mlaursen/react-md/pull/1439
