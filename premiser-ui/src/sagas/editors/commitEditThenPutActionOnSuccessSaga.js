import { take, put, takeEvery } from "redux-saga/effects";

import { editors, flows, str } from "../../actions";

export function* commitEditThenPutActionOnSuccess() {
  yield takeEvery(
    str(flows.commitEditThenPutActionOnSuccess),
    function* commitEditThenPutActionOnSuccessWorker(action) {
      const { editorType, editorId } = action.payload;
      yield put(editors.commitEdit(editorType, editorId));
      let resultAction = null;
      while (!resultAction) {
        const currResultAction = yield take(str(editors.commitEdit.result));
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
