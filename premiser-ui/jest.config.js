module.exports = {
  testRegex: "(/src/.*\\.test\\.js)$",
  setupFiles: ["./jest.setup.js"],
  transformIgnorePatterns: [
    // Transform our linked sources
    "node_modules/(?!(howdju-client-common|howdju-common|howdju-test-common)/)",
  ],
}
