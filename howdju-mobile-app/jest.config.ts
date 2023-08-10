import type { Config } from "jest";
import { merge } from "lodash";

import baseConfig from "../jest.config.base";

const config: Config = {
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  setupFiles: ["./jest/react-navigation-setup.ts"],
  resolver: "./jest/reactNativeResolver.js",
  transformIgnorePatterns: [
    // Include some extra stuff under node_modules in our babel transform
    "node_modules/(?!((@|jest-)?react-native|react-navigation|@react-navigation/.*|react-native-share-menu|normalize-url|approx-string-match))",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleDirectories: ["node_modules"],
};

export default merge(baseConfig, config);
