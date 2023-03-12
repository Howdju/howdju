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
      const { rootTargetType, rootTargetId } = action.payload;
      switch (rootTargetType) {
        case JustificationRootTargetTypes.PROPOSITION: {
          yield put(api.deleteProposition(rootTargetId));
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
