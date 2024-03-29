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
  (`../../../react-native-share-menu`), not it's `node_modules` path. See below
  to update this for release.
- `webpack.config.js` has `resolve.symlinks: false` so that
  it treats `react-native-share-menu` as if it were in `node_modules`. Otherwise
  that dep can't find `react-native`.
- Add `react-native-share-menu` to Jest's `transformIgnorePatterns` so that we
  transform the raw code.
- Add a custom jest resolver that will resolve `react-native-share-menu` peer
  dependencies from within this package.
- We use Re.Pack to bundle the app rather than Metro because it follows
  symlinks. We had to follow
  [these instructions](http://web.archive.org/web/20220724134937/https://re-pack.netlify.app/docs/getting-started/)

## Releasing

### Replace linked react-native-share-menu with committed remote one

```sh
yarn add 'react-native-share-menu@github:Howdju/react-native-share-menu#ff9c65e456cf80b23b881ed2e1247f14337260ec'
```

Replace the relative reference in `ios/Podfile` with a Github reference:

```Podfile
-  pod 'RNShareMenu', :path => '../../../react-native-share-menu'
+  pod 'RNShareMenu', :path => '../node_modules/react-native-share-menu'
```

Remove this following from the monorepo's package:

```json
  "resolutions": {
    "react-native-share-menu": "portal:../react-native-share-menu"
  }
```

### App Store

Basically, follow [these steps](https://reactnative.dev/docs/publishing-to-app-store).

1. Open in Xcode
1. From the target dropdown, select HowdjuShareExtenion Release
1. Remove `NSExceptionDomains` from HowdjuApp `Info.plist`.
1. Update `Bundle Short Version String` (`CFBundleShortVersionString`) and/or `Bundle version`
   (`CFBundleVersion`) (at least one of them must increase from previous release.)

   - `Bundle Short Version String` is the app's version number
   - `Bundle version` is the app's build version.
   - When you increment the `Bundle Short Version String`, you can reset the `Bundle Version`.
   - Recommend we do `Bundle Short Version String` 1.0, 1.1, 1.2 etc. and `Bundle version` 1, 2, 3,
     etc. Reset Bundle version when we increment Bundle Short Version String.
   - Another possible good versioning scheme would be to use simple numbers for
     `Bundle Short Version String` (1, 2, 3) and a date timestamp for the `Bundle version` (YYYYMMDD).

1. Build, Archive, Distribute

## Adding a new native dependency

After installing via Yarn, don't forget:

```shell
yarn run install-pods
```

## `react-native` patch

Our react-native does not hoist to the workspace root (presumably because it has a peer dependency
on react@17, while we use react@16 in the web app, but I'm not 100% sure why.) But one of the deps
that `react-native` expects to be a `node_modules` sibling is hoisted (`react-native-codegen`). This
breaks iOS builds because `react-native` tries to find `react-native-codegen` using a hard-coded
path, and doesn't find it. We have included a Yarn patch for this, which essentially recreates this
[PR](https://github.com/facebook/react-native/pull/35430/files).
