import { put, takeEvery } from "redux-saga/effects";

import {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
} from "howdju-common";

import { api, apiLike, str } from "../actions";
import { logger } from "../logger";

export function* deleteJustificationRootTargetTranslator() {
  yield takeEvery(
    str(apiLike.deleteJustificationRootTarget),
    function* deleteJustificationRootTargetWorker(action) {
      const { rootTargetType, rootTarget } = action.payload;
      switch (rootTargetType) {
        case JustificationRootTargetTypes.PROPOSITION: {
          yield put(api.deleteProposition(rootTarget));
          break;
        }
        case JustificationRootTargetTypes.STATEMENT: {
          logger.error("deleting statements is unimplemented");
          break;
        }
        default:
          throw newExhaustedEnumError();
      }
    }
  );
}

export function* fetchJustificationTargets() {
  yield takeEvery(
    str(apiLike.fetchJustificationTargets),
    function* fetchJustificationTargetsWorker(action) {
      const { targetInfos } = action.payload;
      for (const targetInfo of targetInfos) {
        const { targetType, targetId } = targetInfo;
        switch (targetType) {
          case JustificationRootTargetTypes.PROPOSITION: {
            yield put(api.fetchProposition(targetId));
            break;
          }
          case JustificationRootTargetTypes.STATEMENT: {
            logger.error("fetching statement by ID is unimplemented");
            break;
          }
          case JustificationRootTargetTypes.JUSTIFICATION: {
            logger.error("fetching justification by ID is unimplemented");
            break;
          }
          default:
            throw newExhaustedEnumError();
        }
      }
    }
  );
}
