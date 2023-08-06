module.exports = {
  overrides: [
    {
      files: ["src/**/*.{js,ts}"],
      extends: ["howdju/client-common"],
    },
    {
      // Everything else that isn't part of the app
      files: ["**/*.{js,ts}"],
      excludedFiles: ["src/**", "node_modules/**", "dist/**"],
      extends: ["howdju/node"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
