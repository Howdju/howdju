const { cwd } = require('process')
import type {Config} from 'jest'

/**
 * Our monorepo's base Jest config.
 *
 * Packages use this by importing it and merging any custom config.
 *
 * Note that `${__dirname}` will refer to the location of the package's jest.config, so we must use
 * `__dirname` below to reference files from the workspace root.
 */

const config: Config = {
  testRegex: ".*\\.test\\.[tj]sx?$",
  setupFiles: [`${__dirname}/jest/jest.setup.js`],
  transformIgnorePatterns: [
    // Include some extra stuff under node_modules in our babel transform
    'node_modules/(?!(@grrr/cookie-consent|@grrr/utils))',
  ],
  transform: {
    // This custom transform does:
    // 1. Adds .mjs so that babel transform's the @grrr packages.
    // 2. Uses a babel-jest rooted in the workspace root so that it transforms TypeScript files
    //    under the `jest` subdirectory.
    "^.+\\.(mj|t|j)sx?$": `${__dirname}/babel-jest`,
  },
  reporters: [
    `${__dirname}/jest/OutputConsoleOnFailureOnlyReporter.js`,
    `${__dirname}/node_modules/@jest/reporters/build/SummaryReporter.js`,
  ],
  // TODO add these etc. from howdju-mobile-app/jest.config.js
  // resolver: `${__dirname}/jest/yarn-link-resolver.js`,
  // setupFiles: [`${__dirname}/jest/react-navigation-setup.ts`],
  moduleNameMapper: {
    // Support our custom project-relative import defined in tsconig.json:compilerOptions.paths
    '^@/(.*)': [
      // Prefix with cwd so that the imports are relative to the test project, and not relative to
      // the rootDir, which is the monorepo root where this file was found.
      cwd() + '/src/$1',
      cwd() + '/lib/$1',
    ],
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md)$':
      `${__dirname}/jest/__mocks__/fileMock.js`,
    '\\.(scss|css|less)$': 'identity-obj-proxy',
  },
}

export default config;
