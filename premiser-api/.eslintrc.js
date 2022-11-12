module.exports = {
  overrides: [
    {
      files: [
        "**/*.{js,ts}",
      ],
      excludedFiles: [
        "dist/**",
        "node_modules/**",
      ],
      extends: [
        "howdju/node",
      ],
    },
  ]
}
