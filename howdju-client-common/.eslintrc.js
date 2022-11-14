module.exports = {
  overrides: [
    {
      files: ["lib/**/*.{js,jsx,ts,tsx}"],
      extends: ["howdju/react-web"],
    },
    {
      // Everything else that isn't part of the library
      files: ["**/*.{js,ts}"],
      excludedFiles: ["lib/**", "node_modules/**"],
      extends: ["howdju/node"],
    },
  ],
};
