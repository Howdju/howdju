module.exports = {
  testRegex: ".*\\.test\\.js$",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.(t|j)sx?$": "./babel-jest.js",
  },
}
