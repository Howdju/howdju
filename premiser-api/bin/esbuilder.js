const esbuild = require('esbuild')
const assign = require('lodash/assign')
const flow = require('esbuild-plugin-flow')

const defaultOptions = {
  bundle: true,
  external: ["pg-native"],
  platform: 'node',
  plugins: [flow(/\.jsx?$/)],
  sourcemap: true,
}

module.exports.esbuilder = (options) => esbuild.build(assign({}, defaultOptions, options))
