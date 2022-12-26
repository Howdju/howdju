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

import { newImpossibleError } from "howdju-common";

import { str } from "../actions";
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

  try {
    // TODO(1): Move cancelation action creators out of api and make meta required.
    const config = action.meta && action.meta.apiConfig;
    if (!config) {
      return yield* put(
        responseActionCreator(
          newImpossibleError(
            `Missing resource API config for action type: ${action.type}`
          )
        )
      );
    }
    const {
      endpoint,
      fetchInit,
      normalizationSchema,
      canSkipRehydrate,
      cancelKey,
    } = isFunction(config) ? config(action.payload) : config;

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

    const responseMeta = {
      normalizationSchema,
      requestPayload: action.payload,
    };
    return yield* put(
      responseActionCreator(apiResultAction.payload, responseMeta)
    );
  } catch (error) {
    return yield* put(responseActionCreator(error));
  } finally {
    if (yield* cancelled()) {
      logger.debug(`Canceled ${action.type}`);
    }
  }
}

export function* cancelResourceApiCalls() {
  // TODO(1): move cancel onto the API action creator to avoid toil of adding them here?
  yield takeEvery(
    [
      str(cancelPropositionTextSuggestions),
      str(cancelWritTitleSuggestions),
      str(cancelMainSearchSuggestions),
      str(cancelTagNameSuggestions),
      str(cancelPersorgNameSuggestions),
    ],
    function* cancelCallApiForResourceWorker(action: AnyApiAction) {
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
      const apiConfig = targetAction.meta?.apiConfig;
      if (!apiConfig) {
        logger.error(
          `unable to cancel action type ${targetAction.type} because it lacked apiConfig.`
        );
        return;
      }
      const { cancelKey } = isFunction(apiConfig)
        ? apiConfig(targetAction.payload)
        : apiConfig;
      if (!cancelKey) {
        logger.error(
          `Unablet to infer cancelKey for cancelTargetType ${cancelTarget}`
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
