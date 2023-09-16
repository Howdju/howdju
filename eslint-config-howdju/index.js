const { testFilePattern, typescriptRules } = require("./constants");

/** The base ESLint config. Other ESLint configs should extend this. */
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    babelOptions: {
      rootMode: "upward",
    },
  },
  plugins: ["eslint-comments"],
  env: {
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "prettier",
  ],
  rules: {
    "comma-dangle": ["error", "always-multiline"],
    indent: ["warn", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    "no-cond-assign": ["error", "except-parens"],
    "no-restricted-globals": [
      "error",
      // Don't accidentally use the browser's find.  Use lodash.
      "find",
    ],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        // Allow us to define unused function parameters; this helps document parameters that may be used in the future
        args: "none",
        // Allow us to pluck out properties by naming them specifically and then using a rest property.  E.g.:
        // const { toIgnore, ...rest} = someProps
        ignoreRestSiblings: true,
      },
    ],
    semi: ["error", "never"],
  },
  overrides: [
    {
      files: testFilePattern,
      env: {
        jest: true,
      },
      plugins: ["jest"],
      extends: ["plugin:jest/recommended", "plugin:jest/style", "prettier"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "CallExpression[callee.object.name='jest'][callee.property.name='setTimeout']",
            message:
              "Tests should complete within the default timeout. (Did you forget to remove a call to jest.setTimeout?)",
          },
          {
            selector:
              "CallExpression[callee.object.name='screen'][callee.property.name='debug']",
            message: "Do not commit calls to screen.debug.",
          },
          {
            selector:
              "CallExpression[callee.object.name='screen'][callee.property.name='logTestingPlaygroundURL']",
            message: "Do not commit calls to screen.logTestingPlaygroundURL.",
          },
        ],
        "jest/no-commented-out-tests": "error",
        "jest/no-disabled-tests": "error",
        "jest/no-large-snapshots": "warn",
        "jest/expect-expect": [
          "error",
          {
            assertFunctionNames: ["expect", "waitForElementToBeRemoved"],
          },
        ],
      },
    },
    {
      files: "*.testlib.{js,jsx,ts,tsx}",
      rules: {
        // testlib's should export
        "jest/no-export": "off",
      },
    },
    {
      files: "*.{ts,tsx}",
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        // TODO(#424) extend plugin:@typescript-eslint/strict-type-checked instead
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
      ],
      rules: typescriptRules,
    },
  ],
};
