# Debugging Tests

```
yarn test:debug
```

Then open Chrome at `chrome://inspect` and select the node instance.
[Details](https://jestjs.io/docs/en/troubleshooting#tests-are-failing-and-you-don-t-know-why)

## Hot module reload

I think that I initially followed these instructions:

* [react-hot-loader docs for webpack2](https://github.com/gaearon/react-hot-loader/tree/a03dde0c1833105abf0555e2a3028572bd15493c/docs#webpack-2)
   (I think this is why I had `["es2015", { "modules": false }]` in my code.)
* and http://gaearon.github.io/react-hot-loader/getstarted/

I think I'll just update this approach, following:

* [these instructions](https://github.com/gaearon/react-hot-loader/tree/6032f4255e0268bb794c1e9b8ae5b436400ffbb5#getting-started).
* Summarized in [this comment](https://github.com/gaearon/react-hot-loader/issues/1227#issuecomment-482518698)

Even though the
[recommendation](https://github.com/gaearon/react-hot-loader/tree/6032f4255e0268bb794c1e9b8ae5b436400ffbb5#moving-towards-next-step)
is to move on to Fast Refresh using
[react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin/).

I did:

* `yarn add react-dom@npm:@hot-loader/react-dom@16.14.0` to stay at react-dom@16.

But then I discovered that iframe.onLoad wasn't working in local development (used by extension), and I suspected the
hot loaders interaction with react-dom, so I just switched to `yarn add 'react-dom@^16.2.0'`
