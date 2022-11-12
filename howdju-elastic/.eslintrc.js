module.exports = {
  overrides: [
    {
      // Everything else that isn't part of the library
      files: [
        "**/*.{js,ts}",
      ],
      excludedFiles: [
        "node_modules/**",
      ],
      extends: [
        "howdju/node",
      ],
    },
  ]
}
