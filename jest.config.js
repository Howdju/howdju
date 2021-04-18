module.exports = {
  testRegex: ".*\\.test\\.js$",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.jsx?$": "./babel-jest.js",
  },
}