import { api } from "@/apiActions";
import { put, takeEvery } from "redux-saga/effects";
import justificationsPage from "./justificationsPageSlice";

export function* translateFetchRootJustificationTarget() {
  yield takeEvery(
    justificationsPage.fetchRootJustificationTarget,
    function* translateFetchRootJustificationTargetWorker(action) {
      const { rootTargetType, rootTargetId } = action.payload;
      switch (rootTargetType) {
        case "PROPOSITION":
          yield put(api.fetchPropositionRootJustificationTarget(rootTargetId));
          break;
        case "STATEMENT":
          yield put(api.fetchStatementRootJustificationTarget(rootTargetId));
          break;
      }
    }
  );
}

export function* translateFetchRootJustificationTargetResponse() {
  yield takeEvery(
    [
      api.fetchPropositionRootJustificationTarget.response,
      api.fetchStatementRootJustificationTarget.response,
    ],
    function* translateFetchRootJustificationTargetResponseWorker() {
      yield put(justificationsPage.fetchRootJustificationTargetResponse());
    }
  );
}
