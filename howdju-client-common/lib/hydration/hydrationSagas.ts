import { delay, getContext, race, take } from "typed-redux-saga";
import { REHYDRATE } from "redux-persist/lib/constants";

import * as sagaContextKeys from "@/sagaContextKeys";
import { logger } from "@/logging";

// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false;

export function* flagRehydrate() {
  yield* take(REHYDRATE);
  isRehydrated = true;
}

export interface Config {
  rehydrateTimeoutMs: number;
}

export function* tryWaitOnRehydrate() {
  if (!isRehydrated) {
    logger.debug("Waiting on rehydrate");
    const config = yield* getContext<Config>(sagaContextKeys.config);
    if (!config) {
      throw new Error("config was missing from redux-saga's context.");
    }
    const { rehydrateTimeoutMs } = config;
    const { rehydrate, timeout } = yield* race({
      rehydrate: take(REHYDRATE),
      timeout: delay(rehydrateTimeoutMs),
    });
    if (rehydrate) {
      logger.debug("Proceeding after rehydrate");
    } else if (timeout) {
      logger.warn("Timed out waiting for rehydrate");
    } else {
      logger.error("Unknown rehydrate race condition");
    }
  }
}
