module.exports = {
  testRegex: ".*\\.test\\.[tj]s$",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.(t|j)sx?$": "./babel-jest.js",
  },
}
