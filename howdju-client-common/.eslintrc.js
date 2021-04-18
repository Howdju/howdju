module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    "ecmaFeatures": {
      "jsx": true
    },
    babelOptions: {
      rootMode: "upward",
    },
  },
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": [
    "eslint:recommended",
  ],
  "rules": {
    // https://eslint.org/docs/rules/comma-dangle
    "comma-dangle": [
      "error",
      // "allows (but does not require) trailing commas when the last element or property is in a different line than the closing brace"
      "only-multiline",
    ],
    "indent": [
      "warn",
      2,
      {
        "SwitchCase": 1,
        "ignoredNodes": [
          // We indent to the indent of the first prop, which this rule doesn't support
          "JSXAttribute",
          "JSXSpreadAttribute",
        ],
      }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-restricted-globals": [
      "error",
      // Don't accidentally use the browser's find.  Use lodash.
      "find"
    ],
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        // Allow us to define unused function parameters; this helps document parameters that may be used in the future
        "args": "none",
        // Allow us to pluck out properties by naming them specifically and then using a rest property.  E.g.:
        // const { toIgnore, ...rest} = someProps
        "ignoreRestSiblings": true
      }
    ],
    "require-yield": [
      // Some of our sagas are side-effect only, requiring no yields.  And I don't think there's any harm in this.
      "off"
    ],
    "semi": [
      "error",
      "never"
    ],
  },
  "overrides": [
    {
      "files": "*.test.js",
      "globals": {
        "describe": false,
        "beforeEach": false,
        "expect": false,
        "it": false,
        "jest": false,
        "test": false,
      }
    },
  ],
};
