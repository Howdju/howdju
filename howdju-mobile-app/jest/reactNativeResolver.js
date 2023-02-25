const repack = require("@callstack/repack");
const baseResovler = require("../../jest/resolver");

/** A custom Jest resolver that handles react-native correctly. */
module.exports = (path, options) => {
  // Sometimes packages depending on react-native are hoisted above it, and they cannot find it.
  // So replace all react-native imports with its precise path.
  if (path === "react-native") {
    return options.defaultResolver(repack.getReactNativePath(), options);
  }
  return baseResovler(path, options);
};
