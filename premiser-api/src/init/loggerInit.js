/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

const { AwsLogger } = require("howdju-service-common");

exports.init = function init(provider) {
  const logLevel = provider.getConfigVal("LOG_LEVEL", "debug");
  const isAws = !!provider.getConfigVal("IS_AWS", false);
  const doLogTimestamp = true;
  const doUseCarriageReturns = isAws;
  const logFormat = isAws ? "json" : "text";

  const logger = new AwsLogger(console, {
    logLevel,
    doLogTimestamp,
    doUseCarriageReturns,
    logFormat,
  });

  provider.logger = logger;

  logger.debug("loggerInit complete", { logLevel, isAws });
};
