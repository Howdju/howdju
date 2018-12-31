# Howdju Chrome Extension

## Building

```bash
yarn install
yarn watch
```

## Tests

```sh
yarn test
```

### Debugging tests

Open `chrome://inspect` in Chrome and click "Open dedicated DevTools for node".  Then run:

```bash
yarn test:debug
```

Chrome should automatically connect to the session.  If not, maybe look for the message like
`Debugger listening on ws://127.0.0.1:9229/82619c6d-941e-4c40-aca5-ba736b294b84` and add the host/port on the panel
that comes up after opening the dedicated node DevTools.

Hitting enter in the console will allow the tests to re-run any changes since the last run (via the `--watch` argument.)

## Deploying

For development, you can load the `dist` directory as an unpackaged extension after running `yarn build` (or while 
running `yarn watch`).

For production, update the version in `package.json` and `manifest.json`.  Then:

```sh
yarn build
yarn package
```

And then upload `dist/howdju.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).