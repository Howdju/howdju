module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    babelOptions: {
      rootMode: "upward",
    },
  },
  plugins: [],
  env: {
    "es6": true
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    // https://eslint.org/docs/rules/comma-dangle
    "comma-dangle": [
      "error",
      // "allows (but does not require) trailing commas when the last element or property is in a different line than the closing brace"
      "only-multiline",
    ],
    indent: [
      "warn",
      2,
      {
        SwitchCase: 1,
      },
    ],
    "linebreak-style": ["error", "unix"],
    "no-cond-assign": [
      "error",
      "except-parens"
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
    semi: ["error", "never"],
  },
  overrides: [
    {
      files: [
        "*.test.js",
        "*.testlib.js",
      ],
      env: {
        jest: true,
      },
    },
  ],
}
