# howdju-mobile-app

A workspace for expo mobile apps.

## Development

### Start a local client

This allows you to get live-updates to the Javascript side of things.

```
yarn run start_dev_ios
```

### Create a new development client

You must do this any time the native runtime changes.

```
yarn run build_dev_client_ios
```

Then scan the QR code from the command line to install the app on a provisioned iOS device.

### Register a new development device

You have to do this before you can install a development build directly to an iOS device.

```
eas device:create
```

## Initial setup notes

To get expo to work with Yarn workspaces, follow these instructions:

https://github.com/expo/expo/blob/master/packages/expo-yarn-workspaces/README.md

Also, add this to this package.json:

```json
{
  "installConfig": {
    "hoistingLimits": "workspaces"
  }
}
```

Otherwise I was getting `expo` installed in the root directory and `react-native` installed in his package's `node_modules`, and `expo` couldn't find `react_native`. (Another solution would have been to try to force react-native to install in the root...`expo-yarn-workspaces` would have sym-linked it into this package. But I couldn't figure out how to do that. I also didn't understand why `react-native` wasn't hoisted into the root.)

Note: that it appears that `workspaces.nohoist` has been replaced with `installConfig.hoistingLimits` in Yarn 3.

## EAS Build and Expo custom development client notes

Follow these guides:

* https://docs.expo.dev/build/setup/
* https://docs.expo.dev/build-reference/how-tos/#how-to-set-up-eas-build-with
* https://docs.expo.dev/development/getting-started/
