module.exports = {
  ignorePatterns: ["lib/standaloneAjv.js"],
  overrides: [
    {
      files: ["lib/**/*.{js,ts}"],
      extends: ["howdju/common"],
    },
    {
      // Everything else that isn't part of the library
      files: ["**/*.{js,ts}"],
      excludedFiles: ["lib/**", "node_modules/**"],
      extends: ["howdju/node"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
