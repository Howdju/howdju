# howdju-mobile-app

Howdju React Native mobile app.

## Running

Start the Metro bundler:

```shell
 npx react-native start
 ```

In another terminal, build and run the mobile app:

```shell
npx react-native run-ios
```

```shell
npx react-native run-android
```

## Running on a real device

Run the app from Xcode targeting your device. See the instructions here:
<https://reactnative.dev/docs/running-on-device>

## Debugging the share extension code

Be sure to run the HowdjuShareExtension target instead of the HowdjuMobileApp
extension.

## Local development

This package currently depends on a local version of react-native-share-menu
(<https://github.com/Howdju/react-native-share-menu>). Clone that repo as a
sibling of the howdju monorepo, and then from this package directory
(howdju/howdju-mobile-app) do `yarn link ../../react-native-share-menu`.

Workarounds to support this local link:

* `ios/Podfile` refers to this dependency by its resolved path
(`../../../react-native-share-menu`), not it's `node_modules` path. That will
need to change if `react-native-share-menu` is installed from NPM.
* `webpack.config.js` has `resolve.symlinks: false` so that
it treats `react-native-share-menu` as if it were in `node_modules`. Otherwise
that dep can't find `react-native`.
