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
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "indent": [
      "warn",
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-cond-assign": [
      "error",
      "except-parens"
    ],
    "no-restricted-globals": [
      "error",
      // Use bluebird
      "Promise"
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
        "expect": false,
        "test": false,
      }
    }
  ],
};
