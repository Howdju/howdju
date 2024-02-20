/* This file must pass console to the Logger */
/* eslint "no-console": ["off"] */

import { Logger } from "howdju-common";
import { AwsLogger } from "howdju-service-common";

const logLevel = process.env.LOG_LEVEL || "warn";
const isAws = !!process.env.IS_AWS;
const doLogTimestamp = !isAws;
const doUseCarriageReturns = isAws;
const logFormat = isAws ? "json" : "text";

console.log("initializing logger");

export const logger = new AwsLogger(console, {
  logLevel,
  doLogTimestamp,
  doUseCarriageReturns,
  logFormat,
}) as unknown as Logger;

logger.debug("initializing logger", { logLevel, isAws });
