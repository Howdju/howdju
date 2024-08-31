import { takeEvery, select, put } from "typed-redux-saga";
import { REHYDRATE } from "redux-persist/lib/constants";

import * as sentry from "../sentry";
import analytics from "../analytics";
import {
  selectAuthRefreshExpiration,
  selectUserExternalIds,
} from "../selectors";
import { api } from "../actions";
import { utcNow } from "howdju-common";

export function* configureAfterLogin() {
  yield* takeEvery(
    api.login.response,
    function* configureAfterLoginWorker(action) {
      if (action.error) {
        return;
      }

      const externalIds = yield* select(selectUserExternalIds, {
        sentryId: undefined,
      });
      const { sentryId } = externalIds;
      if (sentryId) {
        sentry.setUserContext(sentryId);
      }

      analytics.identify(externalIds);
    }
  );
}

export function* configureAfterLogout() {
  yield* takeEvery(
    api.logout.response,
    function* configureAfterLogoutWorker(action) {
      if (action.error) {
        return;
      }
      sentry.clearUserContext();
      analytics.unidentify();
    }
  );
}

export function* configureAfterRehydrate() {
  yield* takeEvery(REHYDRATE, function* configureAfterRehydrateWorker() {
    const externalIds = yield* select(selectUserExternalIds, {});
    const { sentryId } = externalIds;
    if (sentryId) {
      sentry.setUserContext(sentryId);
    }
    analytics.identify(externalIds);
  });
}

export function* refreshAuthAfterRehydrate() {
  yield* takeEvery(REHYDRATE, function* configureAfterRehydrateWorker() {
    const authRefreshExpiration = yield* select(selectAuthRefreshExpiration);
    if (authRefreshExpiration && utcNow().isBefore(authRefreshExpiration)) {
      yield put(api.refreshAuth());
    }
  });
}
