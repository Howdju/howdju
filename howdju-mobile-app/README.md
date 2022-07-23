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
(<https://github.com/Howdju/react-native-share-menu>).

Due to issues depending directly on the local dependency
([#55](https://github.com/Howdju/howdju/issues/55)), it is necessary to do
`yarn add ../../react-native-share-menu` whenever that code changes.

Changes made in XCode are to the `node_modules` version, not the local source
controlled version, and so will not survive another `yarn install ...`.
