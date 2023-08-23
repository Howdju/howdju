import config from "./config";
import * as sentry from "./sentry";

/* eslint-disable no-console */
const logFunctions = {
  error: console.error || console.log,
  warn: console.warn || console.log,
  info: console.info || console.log,
  debug: console.debug || console.log,
  trace: console.trace || console.log,
};
/* eslint-enable no-console */
export const logger = {
  error: (message) => {
    logFunctions.error(message);
    sentry.captureMessage(message, "error");
  },
  warn: (message) => {
    logFunctions.warn(message);
    sentry.captureMessage(message, "warning");
  },
  info: logFunctions.info,
  debug: logFunctions.debug,
  trace: logFunctions.trace,
  exception: (err, options = {}) => {
    const { level = "error", extra } = options;
    if (config.isDev) {
      // Sentry wraps all console methods and so will send this to the system too
      logger[level](err);
    }
    sentry.captureException(err, extra);
  },
};
