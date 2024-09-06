import type { Config } from "jest";
import { merge } from "lodash";

import baseConfig from "../jest.config.base";
const baseSetupFilesAfterEnv = baseConfig.setupFilesAfterEnv ?? [];

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    ...baseSetupFilesAfterEnv,
    "../jest/setup-after-env-testing-library-jest-dom.ts",
    "../jest/jsDomWhatWgTextEncoder.js",
  ],
};

export default merge(baseConfig, config);
