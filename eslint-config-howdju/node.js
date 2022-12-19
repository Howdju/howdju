/** ESLint config for node code: either build or backend code. */

const { testFilePattern } = require("./constants");

module.exports = {
  env: {
    node: true,
  },
  plugins: ["promise"],
  extends: ["eslint-config-howdju", "plugin:promise/recommended", "prettier"],
  rules: {
    // This incorrectly warns for Bluebird.catch with 2+ arguments (which is correct invocation.)
    "promise/valid-params": "off",
  },
  overrides: [
    {
      files: testFilePattern,
      rules: {
        // Tests don't need to catch errors.  If we are asserting properly, then the tests should
        // fail if the error causes us to miss the assertion
        "promise/catch-or-return": "off",
      },
    },
  ],
};
