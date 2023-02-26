import {
  put,
  fork,
  join,
  takeEvery,
  cancel,
  cancelled,
  FixedTask,
} from "typed-redux-saga";
import isFunction from "lodash/isFunction";
import values from "lodash/values";

import {
  api,
  AnyApiAction,
  apiActionCreatorsByActionType,
  cancelMainSearchSuggestions,
  cancelPersorgNameSuggestions,
  cancelPropositionTextSuggestions,
  cancelTagNameSuggestions,
  cancelWritTitleSuggestions,
} from "../apiActions";
import { logger } from "../logger";
import { callApi } from "./apiSagas";

export function* resourceApiCalls() {
  const actionTypes = values(api);
  yield takeEvery(actionTypes, callApiForResource);
}

const cancelableResourceCallTasks: Record<string, FixedTask<any>> = {};

export function* callApiForResource(action: AnyApiAction) {
  const responseActionCreator =
    apiActionCreatorsByActionType[action.type].response;

  const {
    endpoint,
    fetchInit,
    normalizationSchema,
    canSkipRehydrate,
    cancelKey,
  } = action.payload;
  const responseMeta = {
    normalizationSchema,
    requestMeta: "meta" in action ? action.meta : undefined,
  };
  try {
    if (cancelKey) {
      const prevTask = cancelableResourceCallTasks[cancelKey];
      if (prevTask) {
        yield* cancel(prevTask);
      }
    }

    const task = yield* fork(callApi, endpoint, fetchInit, canSkipRehydrate);

    if (cancelKey) {
      cancelableResourceCallTasks[cancelKey] = task;
    }

    const apiResultAction = yield* join(task);

    if (cancelKey) {
      delete cancelableResourceCallTasks[cancelKey];
    }

    return yield* put(
      responseActionCreator(apiResultAction.payload, responseMeta)
    );
  } catch (error) {
    return yield* put(responseActionCreator(error, responseMeta));
  } finally {
    if (yield* cancelled()) {
      logger.debug(`Canceled ${action.type}`);
    }
  }
}

export function* cancelResourceApiCalls() {
  // TODO(264): move cancel onto the API action creator to avoid toil of adding them here?
  yield takeEvery(
    [
      cancelPropositionTextSuggestions,
      cancelWritTitleSuggestions,
      cancelMainSearchSuggestions,
      cancelTagNameSuggestions,
      cancelPersorgNameSuggestions,
    ],
    function* cancelCallApiForResourceWorker(action) {
      const { cancelTarget } = action.payload;

      const actionCreator = apiActionCreatorsByActionType[cancelTarget];
      if (!isFunction(actionCreator)) {
        logger.error(
          `cancelTarget (${cancelTarget}) actionCreator is not callable. Skipping cancel.`
        );
        return;
      }
      const cancelTargetArgs = action.payload.cancelTargetArgs as [any, any];
      // Call the cancel target in order to get its cancelKey.
      const targetAction = actionCreator(...cancelTargetArgs) as AnyApiAction;
      const { cancelKey } = targetAction.payload;
      if (!cancelKey) {
        logger.error(
          `Unable to infer cancelKey for cancelTargetType ${cancelTarget}`
        );
        return;
      }

      const prevTask = cancelableResourceCallTasks[cancelKey];
      if (!prevTask) {
        // Nothing to cancel.
        return;
      }

      delete cancelableResourceCallTasks[cancelKey];
      yield* cancel(prevTask);
    }
  );
}
