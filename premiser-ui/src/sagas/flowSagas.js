import some from "lodash/some";
import { put, takeEvery, select } from "redux-saga/effects";
import { LOCATION_CHANGE, push, replace } from "connected-react-router";
import ExpiryMap from "expiry-map";

import {
  httpStatusCodes,
  newProgrammingError,
  utcNowIsAfter,
} from "howdju-common";

import t, {
  MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
} from "../texts";
import paths from "../paths";
import {
  selectAuthTokenExpiration,
  selectLoginRedirectLocation,
} from "../selectors";
import { api, app, flows, goto, str } from "../actions";
import appSliceActions from "../app/appSlice";
import { allApiResponseActions, callApiResponse } from "../apiActions";
import { history } from "../history";
import { isActivePath } from "../routes";
import { tryWaitOnRehydrate } from "./appSagas";

const pendingApiSuccessActions = new ExpiryMap(30_000);
export function* apiActionOnSuccess() {
  yield takeEvery(
    flows.apiActionOnSuccess,
    function* apiActionOnSuccessWorker(action) {
      const { apiAction, onSuccessActions } = action.payload;
      yield put(apiAction);
      const { requestId } = apiAction.payload.fetchInit;
      if (!requestId) {
        return;
      }
      pendingApiSuccessActions.set(requestId, onSuccessActions);
    }
  );
}
export function* apiActionOnSuccessResponse() {
  yield takeEvery(
    allApiResponseActions,
    function* apiActionOnSuccessResponseWorker(action) {
      if (!("meta" in action && "requestMeta" in action.meta)) {
        return;
      }
      const { requestId } = action.meta;
      if (!requestId) {
        return;
      }
      if (!pendingApiSuccessActions.has(requestId)) {
        return;
      }
      const onSuccessActions = pendingApiSuccessActions.get(requestId);
      pendingApiSuccessActions.delete(requestId);
      if (action.error) {
        return;
      }
      for (const onSuccessAction of onSuccessActions) {
        yield put(onSuccessAction);
      }
    }
  );
}

export function* redirectToLoginWhenUnauthenticated() {
  yield takeEvery(
    str(callApiResponse),
    function* redirectToLoginWhenUnauthenticatedWorker(action) {
      if (action.error) {
        const { httpStatusCode } = action.payload;
        if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
          const routerLocation = history.location;
          yield put(goto.login(routerLocation));
        }
      }
    }
  );
}

export function* clearAuthTokenWhenUnauthorized() {
  yield takeEvery(
    str(callApiResponse),
    function* clearAuthTokenWhenUnauthorizedWorker(action) {
      if (action.error) {
        const { httpStatusCode } = action.payload;
        if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
          yield put(app.clearAuthToken());
        }
      }
    }
  );
}

export function* redirectAfterLogin() {
  yield takeEvery(
    str(api.login.response),
    function* redirectAfterLoginWorker(action) {
      if (!action.error) {
        const loginRedirectLocation = yield select(selectLoginRedirectLocation);
        if (loginRedirectLocation) {
          yield put(replace(loginRedirectLocation));
        } else {
          yield put(push(paths.home()));
        }
      }
    }
  );
}

// TODO(471) replace with push(paths.*)
export function* goTo() {
  yield takeEvery(str(goto.login), function* goToLoginWorker() {
    yield put(push(paths.login()));
  });

  yield takeEvery(
    str(goto.createJustification),
    function* goToCreateJustificationWorker() {
      yield put(push(paths.createJustification()));
    }
  );

  yield takeEvery(
    str(goto.proposition),
    function* goToPropositionWorker(action) {
      const { proposition } = action.payload;
      yield put(push(paths.proposition(proposition)));
    }
  );

  yield takeEvery(
    str(goto.justification),
    function* goToJustificationWorker(action) {
      const { justification } = action.payload;
      yield put(push(paths.justification(justification)));
    }
  );

  yield takeEvery(str(goto.mainSearch), function* goToMainSearchWorker(action) {
    const { mainSearchText } = action.payload;
    const mainSearchPath = paths.mainSearch(mainSearchText);
    yield put(push(mainSearchPath));
  });

  yield takeEvery(str(goto.statement), function* goToStatementWorker(action) {
    const { statement } = action.payload;
    yield put(push(paths.statement(statement)));
  });

  yield takeEvery(str(goto.tag), function* goToTagWorker(action) {
    const { tag } = action.payload;
    yield put(push(paths.tag(tag)));
  });

  yield takeEvery(str(goto.writQuote), function* goToWritQuoteWorker(action) {
    const { writQuote } = action.payload;
    yield put(push(paths.writQuote(writQuote)));
  });

  yield takeEvery(
    str(goto.newMediaExcerpt),
    function* goToSubmitMediaExcerptWorker(action) {
      yield put(push(paths.submitMediaExcerpt()));
    }
  );

  yield takeEvery(
    str(goto.mediaExcerpt),
    function* goToMediaExcerptWorker(action) {
      const { mediaExcerpt } = action.payload;
      yield put(push(paths.mediaExcerpt(mediaExcerpt)));
    }
  );
}

export function* redirectHomeFromMissingRootTarget() {
  yield takeEvery(
    [
      api.fetchPropositionRootJustificationTarget.response,
      api.fetchStatementRootJustificationTarget.response,
    ],
    function* redirectHomeFromMissingRootTargetWorker(action) {
      // Try to determine whether we are on the page for a proposition that was not found
      if (
        action.error &&
        action.payload.httpStatusCode === httpStatusCodes.NOT_FOUND
      ) {
        const routerLocation = history.location;
        const { rootTargetId } = action.meta.requestMeta;

        let path, messageKey;
        switch (action.type) {
          case str(api.fetchPropositionRootJustificationTarget.response): {
            path = paths.proposition({ id: rootTargetId });
            messageKey = MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE;
            break;
          }
          case str(api.fetchStatementRootJustificationTarget.response): {
            path = paths.statement({ id: rootTargetId });
            messageKey = MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE;
            break;
          }
          default:
            throw newProgrammingError(
              `Exhausted the actions that redirectHomeFromMissingRootTargetWorker should receive: action.type = ${action.type}`
            );
        }
        // startsWith because we don't have a slug
        if (routerLocation.pathname.startsWith(path)) {
          yield put(appSliceActions.addToast(t(messageKey)));
          yield put(push(paths.home()));
        }
      }
    }
  );
}

export function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication() {
  yield takeEvery(
    LOCATION_CHANGE,
    function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthenticationWorker() {
      yield* tryWaitOnRehydrate();
      const authTokenExpiration = yield select(selectAuthTokenExpiration);
      const isExpired = (dateTimeString) => utcNowIsAfter(dateTimeString);
      const isAuthenticated =
        authTokenExpiration && !isExpired(authTokenExpiration);
      // TODO(247) infer auth requirement from routes
      const doesPathRequireAuthentication = some(
        [
          "submitMediaExcerpt",
          "createProposition",
          "createJustification",
          "submitJustificationViaQueryString",
        ],
        isActivePath
      );
      if (!isAuthenticated && doesPathRequireAuthentication) {
        const loginRedirectLocation = history.location;
        yield put(goto.login(loginRedirectLocation));
      }
    }
  );
}
