const esbuild = require("esbuild");
const assign = require("lodash/assign");

const defaultOptions = {
  bundle: true,
  external: ["pg-native", "canvas"],
  platform: "node",
  sourcemap: true,
};

module.exports.esbuilder = (options) =>
  esbuild.build(assign({}, defaultOptions, options));
