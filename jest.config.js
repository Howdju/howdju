const { cwd } = require('process');

module.exports = {
  testRegex: ".*\\.test\\.[tj]s$",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.(t|j)sx?$": "./babel-jest.js",
  },
  reporters: [
    '<rootDir>/jest/OutputConsoleOnFailureOnlyReporter.js',
    '<rootDir>/node_modules/@jest/reporters/build/SummaryReporter.js',
  ],
  // TODO add these etc. from howdju-mobile-app/jest.config.js
  // resolver: '<rootDir>/jest/yarn-link-resolver.js',
  // setupFiles: ['<rootDir>/jest/react-navigation-setup.ts'],
  moduleNameMapper: {
    // Support our custom project-relative import defined in tsconig.json:compilerOptions.paths
    '^@/(.*)': [
      // Prefix with cwd so that the imports are relative to the test project, and not relative to
      // the rootDir, which is the monorepo root where this file was found.
      cwd() + '/src/$1',
      cwd() + '/lib/$1',
    ],
  },
}
