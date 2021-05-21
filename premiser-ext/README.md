# Howdju Chrome Extension

## Building

```bash
# Done in root project directory once
yarn install
# Will automatically rebuild the source
yarn watch
```

## Development

* Run `yarn build` or `yarn watch`.
* Load the `dist` directory as an unpackaged extension. 
* Watch for any startup errors in the extension card on Chrome's Extensions page.
* Reload the extension using the refresh icon on the card.
* You can also inspect the background page here.

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

Update the version in `package.json` and `manifest.json`.  Then:

```sh
yarn build
yarn package
```

Upload `dist/howdju.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).

## Better loading

Is extension iframe slower? Is it required because only one
extension can do blocking webrequest?

* Extension iframe: https://stackoverflow.com/a/24649134/39396
* https://stackoverflow.com/a/45370418/39396
* https://transitory.technology/browser-extensions-and-csp-headers/
