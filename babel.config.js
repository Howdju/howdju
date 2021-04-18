module.exports = {
  presets: [
    ["@babel/preset-env", { "targets": "defaults" }],
  ],
  plugins: [

    // Stage 1
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-logical-assignment-operators",
    ["@babel/plugin-proposal-optional-chaining", { "loose": false }],
    ["@babel/plugin-proposal-pipeline-operator", { "proposal": "fsharp" }],
    ["@babel/plugin-proposal-nullish-coalescing-operator", { "loose": false }],
    "@babel/plugin-proposal-do-expressions",

    // Stage 2
    // Must come before plugin-proposal-class-properties.
    // plugin-proposal-class-properties must be loose.
    // See https://babeljs.io/docs/en/babel-plugin-proposal-decorators
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",

    // Stage 3
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    // Must be loose for plugin-proposal-decorators
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    "@babel/plugin-proposal-json-strings",
  ],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", {"targets": {"node": "current"}}]
      ],
    }
  },
  babelrcRoots: [
    ".",
    "./howdju-client-common/",
    "./howdju-common/",
    "./howdju-service-common/",
    "./howdju-test-common/",
    "./premiser-ext/",
    "./premiser-ui/",
  ],
}
