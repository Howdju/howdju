module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  ignore: [
    new RegExp(
      // What we add here should probably go into Jest's transformIgnorePatterns too.
      "/node_modules/(?!(@grrr/cookie-consent|@grrr/utils|nanoid|jsdom|strip-indent|normalize-url))"
    ),
  ],
  plugins: [
    // Stage 1
    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-logical-assignment-operators",
    ["@babel/plugin-proposal-optional-chaining", { loose: false }],
    ["@babel/plugin-proposal-pipeline-operator", { proposal: "fsharp" }],
    ["@babel/plugin-proposal-nullish-coalescing-operator", { loose: false }],
    "@babel/plugin-proposal-do-expressions",

    // Stage 2
    // Must come before plugin-proposal-class-properties.
    // plugin-proposal-class-properties must be loose.
    // See https://babeljs.io/docs/en/babel-plugin-proposal-decorators
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",

    // Stage 3
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    // Must be loose for plugin-proposal-decorators
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    // loose must be the same as for plugin-proposal-class-properties
    ["@babel/plugin-proposal-private-methods", { loose: true }],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
    "@babel/plugin-proposal-json-strings",

    // I think this is already supported in all major browsers
    "@babel/plugin-transform-parameters",
  ],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript",
      ],
    },
  },
  babelrcRoots: [
    ".",
    "./howdju-client-common/",
    "./howdju-common/",
    "./howdju-service-common/",
    "./howdju-test-common/",
    "./premiser-api/",
    "./premiser-ext/",
    "./premiser-ui/",
    "./lambdas/*",
  ],
};
