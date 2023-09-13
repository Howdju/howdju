import { take, put, takeEvery } from "typed-redux-saga";

import { editors, flows } from "../../actions";

export function* commitEditThenPutActionOnSuccess() {
  yield takeEvery(
    flows.commitEditThenPutActionOnSuccess,
    function* commitEditThenPutActionOnSuccessWorker(action) {
      const { editorType, editorId } = action.payload;
      yield put(editors.commitEdit(editorType, editorId));
      let resultAction = null;
      // TODO(469) add a race to timeout
      while (!resultAction) {
        const currResultAction = yield* take(editors.commitEdit.result);
        if (
          currResultAction.payload.editorType === editorType &&
          currResultAction.payload.editorId === editorId
        ) {
          resultAction = currResultAction;
        }
      }
      if (!resultAction.error) {
        yield put(action.payload.onSuccessAction);
      }
    }
  );
}
