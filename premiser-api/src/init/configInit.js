const isArray = require("lodash/isArray");
const merge = require("lodash/merge");

const { arrayToObject } = require("howdju-common");
const { baseConfig } = require("howdju-service-common");

exports.init = function init(provider) {
  let envConfig;
  switch (process.env.NODE_ENV) {
    case "development":
      provider.logger.debug("loading development config");
      envConfig = require("../config/config.development.js");
      provider.logger.debug("loaded development config");
      break;
    case "production":
      provider.logger.debug("loading production config");
      envConfig = require("../config/config.production.js");
      provider.logger.debug("loaded production config");
      break;
    default:
      throw new Error(
        `Configuration was not found for requested env ${process.env.NODE_ENV}`
      );
  }

  const stageConfig = {
    uiAuthority: provider.getConfigVal(
      "UI_AUTHORITY",
      "https://www.howdju.com"
    ),
  };

  const appConfig = merge({}, baseConfig, stageConfig, envConfig);

  provider.appConfig = appConfig;
  provider.allowedOrigins = isArray(appConfig.corsAllowOrigin)
    ? arrayToObject(appConfig.corsAllowOrigin)
    : arrayToObject([appConfig.corsAllowOrigin]);

  provider.logger.debug("configInit complete");
};
