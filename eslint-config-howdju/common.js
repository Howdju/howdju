/** ESLint config for library code shared between frontend and backends. */

module.exports = {
  env: {
    "shared-node-browser": true,
  },
  extends: [
    "eslint-config-howdju",
  ],
};
