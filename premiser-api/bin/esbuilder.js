const esbuild = require("esbuild");
const merge = require("lodash/merge");

// types: https://github.com/evanw/esbuild/blob/main/lib/shared/types.ts
const defaultOptions = {
  alias: {
    // Replace all punycode imports with the installed version.
    // See https://github.com/Howdju/howdju/issues/444 for background.
    punycode: "punycode/punycode.js",
  },
  bundle: true,
  external: ["pg-native", "canvas"],
  target: "node14",
  platform: "node",
  sourcemap: true,
};

module.exports.esbuilder = (options) =>
  esbuild.build(merge({}, defaultOptions, options));
