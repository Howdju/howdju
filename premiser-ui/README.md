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

This workspace currently depends on a branch in a fork of react-md. This fork:

- adds `event.preventDefault()` when the user presses enter to autocomplete. This change prevents
  submitting a form when the user is autocompleting.
  [PR](https://github.com/mlaursen/react-md/pull/1439)
- uses TextArea in AutoComplete instead of TextInput. (See autocomplete requires in
  [this comment](https://github.com/Howdju/howdju/issues/304#issuecomment-1511515470).)
- upgrades the repo to Yarn berry so that I can add it (command below)

The steps to add this dependency are to run this command:

```sh
yarn add '@react-md/autocomplete@Howdju/react-md#workspace=@react-md/autocomplete&commit=c5bb05609126221985da30395a71cfdebd9d07d9'
```

And then manually to edit the `yarn.lock` entry for @react-md/autocomplete to point @react-md/form
to the same version:

```diff
dependencies:
-    "@react-md/form": ^2.9.1
+    "@react-md/form": https://github.com/Howdju/react-md.git#workspace=%40react-md%2Fform&commit=c5bb05609126221985da30395a71cfdebd9d07d9
```
