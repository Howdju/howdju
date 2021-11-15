# howdju-mobile-app

A workspace for expo mobile apps.

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
