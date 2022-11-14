import { takeEvery, select } from "redux-saga/effects";
import { REHYDRATE } from "redux-persist/lib/constants";

import * as sentry from "../sentry";
import * as smallchat from "../smallchat";
import analytics from "../analytics";
import { selectUserExternalIds } from "../selectors";
import { api, str } from "../actions";

export function* configureAfterLogin() {
  yield takeEvery(
    str(api.login.response),
    function* configureAfterLoginWorker(action) {
      if (action.error) {
        return;
      }

      const externalIds = yield select(selectUserExternalIds);
      const { sentryId, smallchatId } = externalIds;
      if (sentryId) {
        sentry.setUserContext(sentryId);
      }

      if (smallchatId) {
        smallchat.identify(smallchatId);
      }
      analytics.identify(externalIds);
    }
  );
}

export function* configureAfterLogout() {
  yield takeEvery(
    str(api.logout.response),
    function* configureAfterLogoutWorker(action) {
      if (action.error) {
        return;
      }
      sentry.clearUserContext();
      smallchat.unidentify();
      analytics.unidentify();
    }
  );
}

export function* configureAfterRehydrate() {
  yield takeEvery(REHYDRATE, function* configureAfterRehydrateWorker() {
    const externalIds = yield select(selectUserExternalIds, {});
    const { sentryId } = externalIds;
    if (sentryId) {
      sentry.setUserContext(sentryId);
    }
    analytics.identify(externalIds);
  });
}
