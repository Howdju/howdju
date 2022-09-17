import type {Config} from 'jest';

const config: Config = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  setupFiles: ['<rootDir>/jest/react-navigation-setup.ts'],
  transformIgnorePatterns: [
    // Include some extra stuff under node_modules in our babel transform
    'node_modules/(?!((@|jest-)?react-native|react-navigation|@react-navigation/.*|react-native-share-menu))',
  ],
  resolver: '<rootDir>/jest/yarn-link-resolver.js',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    // Support our custom project-relative import defined in tsconig.json:compilerOptions.paths
    '@/(.*)': '<rootDir>/src/$1',
  },
};

export default config;
