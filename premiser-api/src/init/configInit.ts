import isArray from "lodash/isArray";
import merge from "lodash/merge";

import { arrayToObject } from "howdju-common";
import {
  baseConfig,
  ApiConfig,
  LoggerProvider,
  ConfigProviderConfig,
} from "howdju-service-common";
import { devWebServerPort } from "howdju-ops";

import devConfig from "../config/config.development";
import prodConfig from "../config/config.production";

export function makeConfig(provider: LoggerProvider): ConfigProviderConfig {
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
      let corsAllowOrigin = devConfig.corsAllowOrigin;
      if (process.env.API_HOST) {
        const localOrigin = `http://${
          process.env.API_HOST
        }:${devWebServerPort()}`;
        corsAllowOrigin = [localOrigin, ...corsAllowOrigin];
      }
      if (process.env.EXTRA_CORS_HOSTS) {
        const extraCorsHosts = process.env.EXTRA_CORS_HOSTS.split(",").map(
          (h) => `http://${h}:${devWebServerPort()}`
        );
        corsAllowOrigin = [...extraCorsHosts, ...corsAllowOrigin];
      }
      console.log({ corsAllowOrigin });
      return merge({}, devConfig, { corsAllowOrigin });
    }
    case "production":
      return prodConfig;
    default:
      throw new Error(
        `Configuration was not found for requested env ${process.env.NODE_ENV}`
      );
  }
}
