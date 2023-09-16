import { takeEvery } from "typed-redux-saga";
import { LocationChangeAction, LOCATION_CHANGE } from "connected-react-router";

import analytics from "../analytics";

export function* sendPageView() {
  yield takeEvery(
    LOCATION_CHANGE,
    function* locationChangeWorker(action: LocationChangeAction) {
      analytics.sendPageView(action.payload.location.pathname);
    }
  );
}
