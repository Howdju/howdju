module.exports = {
  testRegex: "(/src/.*\\.test\\.js)$",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.jsx?$": "../babel-jest.js",
  },
}
