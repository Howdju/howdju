const { cwd } = require('process');

module.exports = {
  testEnvironment: 'jsdom',
  testRegex: ".*\\.test\\.[tj]sx?$",
  setupFiles: ["<rootDir>/jest/jest.setup.js"],
  setupFilesAfterEnv: ['<rootDir>/jest/jest-setup-after-env.ts'],
  transformIgnorePatterns: [
    // Include some extra stuff under node_modules in our babel transform
    'node_modules/(?!(@grrr/cookie-consent|@grrr/utils))',
  ],
  transform: {
    "^.+\\.(mj|t|j)sx?$": "babel-jest",
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
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$':
      '<rootDir>/jest/__mocks__/fileMock.js',
    '\\.(scss|css|less)$': 'identity-obj-proxy',
  },
}
