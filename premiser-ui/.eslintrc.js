module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": [
    "eslint:recommended",
    // https://github.com/yannickcr/eslint-plugin-react/tree/master/docs/rules
    "plugin:react/recommended"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 8,
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true,
      "jsx": true
    },
    "sourceType": "module"
  },
  "plugins": [
    "react",
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
        "test": false,
        "jest": false,
      }
    },
  ],
};