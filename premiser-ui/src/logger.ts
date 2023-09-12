import config from "./config";
import * as sentry from "./sentry";
import { Extras } from "@sentry/types";
import { toJson } from "howdju-common";

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
  error: (message: string, ...args: any[]) => {
    logFunctions.error(message, ...args);
    const argsString = args.length ? `:  ${toJson(args)}` : "";
    sentry.captureMessage(`${message}${argsString}`, "error");
  },
  warn: (message: string) => {
    logFunctions.warn(message);
    sentry.captureMessage(message, "warning");
  },
  info: logFunctions.info,
  debug: logFunctions.debug,
  trace: logFunctions.trace,
  exception: (err: Error, options: { level?: string; extra?: Extras } = {}) => {
    const { level = "error", extra } = options;
    if (config.isDev) {
      // Sentry wraps all console methods and so will send this to the system too
      (logger[level as keyof typeof logger] as any)(`${err}`);
    }
    sentry.captureException(err, extra);
  },
};
