# Howdju Chrome Extension

## Building

```sh
# Done once in workspace root
yarn run install
# Automatically rebuild from the source
yarn run watch
```

## Development

- Run `yarn run build-dev` or `yarn run watch`.
- Load the `dist` directory as an unpackaged extension.
- Watch for any startup errors in the extension card on Chrome's Extensions page.
- Reload the extension using the refresh icon on the card.
- You can also inspect the background page here.

## Tests

```sh
yarn run test
```

### Debugging tests

Open `chrome://inspect` in Chrome and click "Open dedicated DevTools for node". Then run:

```sh
yarn run test-inspect
```

Chrome should automatically connect to the session. If not, maybe look for the message like
`Debugger listening on ws://127.0.0.1:9229/82619c6d-941e-4c40-aca5-ba736b294b84` and add the host/port on the panel
that comes up after opening the dedicated node DevTools.

Hitting enter in the console will allow the tests to re-run any changes since the last run (via the `--watch` argument.)

## Deploying

```sh
yarn run build-prod
yarn run package
```

Upload `dist/howdju.zip` to the [Chrome Developer
Dashboard](https://chrome.google.com/webstore/developer/dashboard). (Ensure the version has already
been incremented.)

Increment the version in `package.json`.

## Better loading

Is extension iframe slower? Is it required because only one
extension can do blocking webrequest?

- Extension iframe: https://stackoverflow.com/a/24649134/39396
- https://stackoverflow.com/a/45370418/39396
- https://transitory.technology/browser-extensions-and-csp-headers/

## Extension signaling

The extension has many similar concepts related to signaling. Actions are usual redux actions.
Messages are not for redux, but have a similar flux action style (a `type` and a payload.)

Here is a list of them along with short explanations:

- `howdju-client-common/actions.extension`: actions for the iframed web app to signal to the content
  script.
- `howdju-client-common/actions.extensionFrame`: actions for the content script to signal to the
  iframed web app.
- `ExtensionFrameAction`: a type of all `actions.extensionFrame` actions.
- `ExtensionMessage`: messages between the background page and a content script in a tab
- `ContentScriptCommand`: contained in some `ExtensionMessage`s. Represents an action the
  content script can take.

  Sometimes the content tab must reload, e.g. to show a source, but it
  wants to take actions afterwards, e.g. to highlight a quote. It sends Commands to the background
  script whch will send them back after the tab reloads so that they can take affect on a new page.

- `ExtensionFrameCommand`: the contents of the Command `postActionMessageToFrame` for sending
  `ExtensionFrameAction`s.
- `IframedAppMessage`: a container for a `ExtensionFrameAction` that a
  content script sends to the iframed web app to add a `source`.
- `WindowMessage = IframedAppMessage | TrackingConsentWindowMessage`: messages the
  `WindowMessageHandler` can receive.
