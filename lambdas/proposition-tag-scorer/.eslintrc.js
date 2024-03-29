module.exports = {
  overrides: [
    {
      files: ["**/*.{js,ts}"],
      excludedFiles: ["node_modules/**"],
      extends: ["howdju/node"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
