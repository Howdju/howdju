module.exports = {
  overrides: [
    {
      files: ["index.js", "index.share.js", "src/**/*.{js,jsx,ts,tsx}"],
      plugins: [
        // TODO I don't know why this config doesn't pick up the jest plugin added in eslint-config-howdju/index
        "jest",
      ],
      extends: ["howdju/react-native"],
    },
    {
      // Everything else that isn't part of the app
      files: ["**/*.{js,ts}"],
      excludedFiles: [
        "index.js",
        "index.share.js",
        "src/**",
        "node_modules/**",
        "build/**",
      ],
      extends: ["howdju/node"],
    },
  ],
};
