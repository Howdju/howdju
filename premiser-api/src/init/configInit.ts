import isArray from "lodash/isArray";
import merge from "lodash/merge";

import { arrayToObject } from "howdju-common";
import {
  baseConfig,
  ApiConfig,
  LoggerProvider,
  AppConfigProvider,
} from "howdju-service-common";

import devConfig from "../config/config.development";
import prodConfig from "../config/config.production";

export function makeConfig(provider: LoggerProvider): AppConfigProvider {
  const stageConfig = {
    uiAuthority: provider.getConfigVal(
      "UI_AUTHORITY",
      "https://www.howdju.com"
    ),
  };

  const envConfig = getEnvConfig();

  const appConfig = merge({}, baseConfig, stageConfig, envConfig);
  const allowedOrigins = isArray(appConfig.corsAllowOrigin)
    ? arrayToObject(appConfig.corsAllowOrigin)
    : arrayToObject([appConfig.corsAllowOrigin]);

  return {
    appConfig,
    allowedOrigins,
  };
}

function getEnvConfig(): Partial<ApiConfig> {
  switch (process.env.NODE_ENV) {
    case "development": {
      return devConfig;
    }
    case "production":
      return prodConfig;
    default:
      throw new Error(
        `Configuration was not found for requested env ${process.env.NODE_ENV}`
      );
  }
}
