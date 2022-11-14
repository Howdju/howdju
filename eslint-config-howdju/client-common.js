const { testFilePattern } = require("./constants");

/**
 * ESLint config for React Native
 *
 * Use this instead of
 * [`eslint-config-react-native-community`](https://github.com/facebook/react-native/blob/main/packages/eslint-config-react-native-community/index.js).
 * While that config provides a useful starting point, it does at least two really annoying things:
 * 1) it requires eslint-plugin-ft-flow, which prevents us from upgrading to ESLint 8.
 * 2) it extends eslint-plugin-prettier, which is
 *    [not recommended](https://prettier.io/docs/en/integrating-with-linters.html#notes). Instead,
 *    we can use `prettier --check`.
 * */
module.exports = {
  env: {
    es6: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  extends: [
    "eslint-config-howdju",
    "plugin:react/recommended",
    "prettier",
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    indent: [
      "warn",
      2,
      {
        "SwitchCase": 1,
        "ignoredNodes": [
          // We indent to the indent of the first prop, which this rule doesn't support
          "JSXAttribute",
          "JSXSpreadAttribute",
        ],
      },
    ],
    "react/boolean-prop-naming": "error",
    "react/no-children-prop": [
      // react-md requires us to use a children prop
      "off",
    ],
    "react/prop-types": [
      // This rule can't pick up props added by redux's mapStateToProps/mapDispatchToProps
      "off",
    ],
    // This doesn't seem to help; need to disable indent on JSXAttribute
    // "react/jsx-indent-props": [
    //   // We indent to the indent of the first prop, which this rule doesn't support
    //   "off"
    // ],
    "require-yield": [
      // Some of our sagas are side-effect only, requiring no yields.  And I don't think there's any harm in this.
      "off",
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  overrides: [
    {
      files: testFilePattern,
      extends: [
        "plugin:jest-dom/recommended",
        "prettier",
      ],
      plugins: [
        "jest-dom",
      ],
    },
  ],
};
