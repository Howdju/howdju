const { testFilePattern } = require("./constants");

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
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            // We intentionallly extract unused props to prevent passing them to child React components
            ignoreRestSiblings: true,
          },
        ],
        "@typescript-eslint/ban-ts-comment": [
          "error",
          {
            "ts-ignore": "allow-with-description",
          },
        ],
        // TODO(1): replace these global overrides with specific per instance overrides
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
      },
    },
  ],
};
