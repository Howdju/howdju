import { call, put, takeEvery } from "typed-redux-saga";

import { api, AnyApiAction } from "howdju-client-common";

import { editors } from "@/actions";
import { callApiForResource } from "../resourceApiSagas";

/** Translates an editor action to an API call. */
export function* inferMediaExcerptInfo() {
  yield takeEvery(
    editors.inferMediaExcerptInfo,
    function* inferMediaExcerptInfoWorker(action) {
      const { editorType, editorId, url, index, quotation } = action.payload;
      try {
        const result = yield* call(
          callApiForResource,
          api.inferMediaExcerptInfo(url, quotation) as AnyApiAction
        );
        if (result.error) {
          yield* put(
            editors.inferMediaExcerptInfoFailed(
              editorType,
              editorId,
              index,
              result.payload
            )
          );
          return;
        }
        const { mediaExcerptInfo } = result.payload;
        yield* put(
          editors.inferMediaExcerptInfoSucceeded(
            editorType,
            editorId,
            index,
            mediaExcerptInfo
          )
        );
      } catch (error) {
        yield* put(
          editors.inferMediaExcerptInfoFailed(
            editorType,
            editorId,
            index,
            error as Error
          )
        );
      }
    }
  );
}
