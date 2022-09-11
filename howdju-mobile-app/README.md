# howdju-mobile-app

Howdju React Native mobile app.

## Running

Start the bundler:

```shell
 yarn run start
```

In another terminal, build and run the mobile app:

```shell
yarn run ios
```

```shell
yarn run android
```

Or run the mobile app from Xcode/Android Studio.

## Running on a real device

Run the app from Xcode targeting your device. See the instructions here:
<https://reactnative.dev/docs/running-on-device>

## Debugging the share extension code

Run the HowdjuShareExtension target instead of the HowdjuMobileApp extension so
that the debugger attaches to that process.

## Local development

This package currently depends on a local version of react-native-share-menu
(<https://github.com/Howdju/react-native-share-menu>). Clone that repo as a
sibling of the howdju monorepo, and then from this package directory
(howdju/howdju-mobile-app) do `yarn link ../../react-native-share-menu`.

Workarounds to support this local link:

- `ios/Podfile` refers to this dependency by its resolved path
  (`../../../react-native-share-menu`), not it's `node_modules` path. That will
  need to change if `react-native-share-menu` is installed from NPM.
- `webpack.config.js` has `resolve.symlinks: false` so that
  it treats `react-native-share-menu` as if it were in `node_modules`. Otherwise
  that dep can't find `react-native`.
- We use Re.Pack to bundle the app rather than Metro because it follows
  symlinks. We had to follow
  [these instructions](http://web.archive.org/web/20220724134937/https://re-pack.netlify.app/docs/getting-started/)

## Adding a new native dependency

After installing via Yarn, don't forget:

```shell
yarn run install-pods
```
