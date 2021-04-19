module.exports = {
  env: {
    "node": true
  },
  plugins: [
    "promise"
  ],
  extends: [
    "plugin:promise/recommended",
  ],
  rules: {
    "no-restricted-globals": [
      "error",
      {
        name: "Promise",
        message: "Use bluebird instead of native Promise.",
      },
    ],
    // This incorrectly warns for Bluebird.catch with 2+ arguments (which is correct invocation.)
    "promise/valid-params": "off",
  },
  overrides: [
    {
      files: "*.test.js",
      rules: {
        // Tests don't need to catch errors.  If we are asserting properly, then the tests should fail if the error causes us to miss the assertion
        "promise/catch-or-return": "off",
      }
    },
  ],
};
