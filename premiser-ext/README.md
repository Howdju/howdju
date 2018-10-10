# Howdju Chrome Extension

## Building

```bash
yarn
yarn dev
```

## Debugging tests

Open `chrome://inspect` in Chrome and click "Open dedicated DevTools for node".  Then run:

```bash
yarn test:debug
```

Chrome should automatically connect to the session.  If not, maybe look for the message like
`Debugger listening on ws://127.0.0.1:9229/82619c6d-941e-4c40-aca5-ba736b294b84` and add the host/port on the panel
that comes up after opening the dedicated node DevTools.

Hitting enter in the console will allow the tests to re-run any changes since the last run (via the `--watch` argument.)

## Installing Extension

For development, you need to load it as an unpacked extension:

![How to load unpacked extension](http://i.imgur.com/CYAw5mf.gif)

For production, [publish to the Chrome Web Store](https://developer.chrome.com/webstore/publish). You can keep the 
extension unlisted (no one can search for it) or [private](https://support.google.com/chrome/a/answer/2663860?hl=en) 
(people have to be added to a Google group to see it).
