import { call, delay, put, select, takeEvery } from "typed-redux-saga";
import { PayloadAction } from "@reduxjs/toolkit";
import { find, pick, isEmpty } from "lodash";

import { selectLoggedErrors } from "../selectors";
import { str, errors } from "../actions";
import { logger } from "../logger";
import * as customHeaderKeys from "../customHeaderKeys";

// TODO(472) remove error-logging Saga
export function* logErrors() {
  yield* takeEvery(
    "*",
    function* logErrorsWorker(action: PayloadAction<any, string, any, any>) {
      if (!action.error) {
        return;
      }

      const error = action.payload;
      const loggedErrors = yield* select(selectLoggedErrors);
      // Sometimes we wrap the same exception in multiple actions, such as callApiResponse and then fetchPropositions.response
      // So don't log the same error multiple times
      if (!find(loggedErrors, (e) => e === error)) {
        // Nest `error` in an object so that we don't recurse on this saga worker.
        yield* put(errors.logError({ error }));
        const identifierKeys = pick(error, customHeaderKeys.identifierKeys);
        const options = isEmpty(identifierKeys)
          ? undefined
          : { extra: identifierKeys };
        logger.exception(error, options);
      }
    }
  );

  yield* takeEvery(
    str(errors.clearLoggedErrors),
    function* clearLoggedErrorsWorker() {
      // Periodically clear the logged errors since the find above is linear
      yield* call(delay, 10000);
      yield* put(errors.clearLoggedErrors());
    }
  );
}
