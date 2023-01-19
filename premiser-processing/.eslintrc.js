module.exports = {
  overrides: [
    {
      files: ["**/*.{js,ts}"],
      excludedFiles: ["node_modules/**"],
      extends: ["howdju/node", "prettier"],
    },
  ],
  parserOptions: {
    project: ["./tsconfig.json"],
  },
};
