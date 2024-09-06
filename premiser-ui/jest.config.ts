import type { Config } from "jest";
import { merge } from "lodash";

import baseConfig from "../jest.config.base";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    ...(baseConfig.setupFilesAfterEnv ?? []),
    "../jest/setup-after-env-testing-library-jest-dom.ts",
    "../jest/jsDomWhatWgTextEncoder.js",
    "./jest/matchMedia.js",
  ],
};

export default merge(baseConfig, config);
