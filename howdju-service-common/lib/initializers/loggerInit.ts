/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

import { Logger } from "howdju-common";
import { AwsLogger } from "..";

import type { BaseProvider } from "./BaseProvider";

export type LoggerProvider = ReturnType<typeof loggerInit> & BaseProvider;

export function loggerInit(provider: BaseProvider) {
  const logLevel = provider.getConfigVal("LOG_LEVEL", "debug");
  const isAws = !!provider.getConfigVal("IS_AWS", "");
  const doLogTimestamp = true;
  const doUseCarriageReturns = isAws;
  const logFormat = isAws ? "json" : "text";

  const logger = new AwsLogger(console, {
    logLevel,
    doLogTimestamp,
    doUseCarriageReturns,
    logFormat,
  }) as unknown as Logger;

  logger.debug("loggerInit complete", { logLevel, isAws });

  return { logger };
}
