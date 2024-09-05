import { delay, race, take, takeEvery } from "typed-redux-saga";
import { REHYDRATE } from "redux-persist/lib/constants";

import config from "../config";
import { logger } from "@/logging";

// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false;

export function* flagRehydrate() {
  yield* takeEvery(REHYDRATE, function* flagRehydrateWorker() {
    isRehydrated = true;
  });
}

export function* tryWaitOnRehydrate() {
  if (!isRehydrated) {
    logger.debug("Waiting on rehydrate");
    const { rehydrate, timeout } = yield* race({
      rehydrate: take(REHYDRATE),
      timeout: delay(config.rehydrateTimeoutMs),
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
