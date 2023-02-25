/**
 * Entry point for mobile app.
 */

import React from "react";
import { AppRegistry } from "react-native";

import App from "./src/App";
import { name as appName } from "./app.json";

// Wrap App in a Root so that App supports HMR.
// https://re-pack.netlify.app/docs/known-issues/#hot-module-replacement--react-refresh
export function Root() {
  return <App />;
}

AppRegistry.registerComponent(appName, () => Root);
