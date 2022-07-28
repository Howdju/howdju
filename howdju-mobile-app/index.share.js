/* Entry point for share extension view. */

import {AppRegistry} from 'react-native';
import Share from './src/Share';
import React from 'react';

// Wrap App in a Root so that App supports HMR.
// https://re-pack.netlify.app/docs/known-issues/#hot-module-replacement--react-refresh
export function Root() {
  return <Share />;
}

AppRegistry.registerComponent('ShareMenuModuleComponent', () => Root);
