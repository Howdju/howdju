module.exports = {
  parserOptions: {
    "ecmaFeatures": {
      "jsx": true
    },
  },
  env: {
    "browser": true,
  },
  extends: [
    "plugin:react/recommended"
  ],
  plugins: [
    "react",
  ],
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
      }
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
      "off"
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
