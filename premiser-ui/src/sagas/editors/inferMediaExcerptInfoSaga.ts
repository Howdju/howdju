import { call, put, takeEvery } from "typed-redux-saga";

import { api, editors } from "@/actions";
import { callApiForResource } from "../resourceApiSagas";
import { AnyApiAction } from "@/apiActions";

export function* inferMediaExcerptInfo() {
  yield takeEvery(
    editors.inferMediaExcerptInfo,
    function* inferMediaExcerptInfoWorker(action) {
      const { editorType, editorId, url, quotation } = action.payload;
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
            mediaExcerptInfo
          )
        );
      } catch (error) {
        yield* put(
          editors.inferMediaExcerptInfoFailed(
            editorType,
            editorId,
            error as Error
          )
        );
      }
    }
  );
}
