/** ESLint config for library code shared between frontend and backends. */

module.exports = {
  env: {
    "shared-node-browser": true,
    "node": true,  // babel will transpile node-like imports (require, module, etc.)
  },
  extends: [
    "eslint-config-howdju",
    "prettier",
  ],
}
