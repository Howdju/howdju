import some from 'lodash/some'
import {
  put,
  takeEvery,
  select,
} from 'redux-saga/effects'
import {LOCATION_CHANGE, push, replace} from 'react-router-redux'

import {
  httpStatusCodes,
  isTruthy,
} from 'howdju-common'

import t, {
  DELETE_PROPOSITION_SUCCESS_TOAST_MESSAGE,
  MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE,
} from '../texts'
import paths from "../paths"
import mainSearcher from '../mainSearcher'
import {
  selectAuthToken,
  selectLoginRedirectLocation,
} from "../selectors"
import {
  api,
  app,
  goto,
  ui,
  str,
} from "../actions"
import {history} from '../history'
import {isActivePath, routeIds} from '../routes'
import {tryWaitOnRehydrate} from './appSagas'


export function* goHomeIfDeletePropositionWhileViewing() {
  yield takeEvery(str(api.deleteProposition.response), function* goHomeIfDeletePropositionWhileViewingWorker(action) {
    if (!action.error) {
      const routerLocation = history.location
      if (routerLocation.pathname === paths.proposition(action.meta.requestPayload.proposition)) {
        yield put(ui.addToast(t(DELETE_PROPOSITION_SUCCESS_TOAST_MESSAGE)))
        yield put(push(paths.home()))
      }
    }
  })
}

export function* redirectToLoginWhenUnauthenticated() {
  yield takeEvery(str(api.callApi.response), function* redirectToLoginWhenUnauthenticatedWorker(action) {
    if (action.error) {
      const {httpStatusCode} = action.payload
      if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
        const routerLocation = history.location
        yield put(goto.login(routerLocation))
      }
    }
  })
}

export function* clearAuthTokenWhenUnauthorized() {
  yield takeEvery(str(api.callApi.response), function* clearAuthTokenWhenUnauthorizedWorker(action) {
    if (action.error) {
      const {httpStatusCode} = action.payload
      if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
        yield put(app.clearAuthToken())
      }
    }
  })
}

export function* redirectAfterLogin() {
  yield takeEvery(str(api.login.response), function* redirectAfterLoginWorker(action) {
    if (!action.error) {
      const loginRedirectLocation = yield select(selectLoginRedirectLocation)
      if (loginRedirectLocation) {
        yield put(replace(loginRedirectLocation))
      } else {
        yield put(push(paths.home()))
      }
    }
  })
}

export function* goTo() {

  yield takeEvery(str(goto.login), function* goToLoginWorker() {
    yield put(push(paths.login()))
  })

  yield takeEvery(str(goto.createJustification), function* goToCreateJustificationWorker() {
    yield put(push(paths.createJustification()))
  })

  yield takeEvery(str(goto.mainSearch), function* goToMainSearchWorker(action) {
    const {
      mainSearchText
    } = action.payload

    const mainSearchPath = paths.mainSearch(mainSearchText)
    const routerLocation = history.location
    const routerMainSearchText = mainSearcher.mainSearchText(routerLocation)
    const urlSearchText = paths.mainSearch(routerMainSearchText)
    if (urlSearchText !== mainSearchPath) {
      yield put(push(mainSearchPath))
    }

    yield put(api.fetchPropositionsSearch(mainSearchText))
  })

  yield takeEvery(str(goto.proposition), function* goToPropositionWorker(action) {
    const {proposition} = action.payload
    yield put(push(paths.proposition(proposition)))
  })

  yield takeEvery(str(goto.tag), function* goToTagWorker(action) {
    const {
      tag
    } = action.payload
    yield put(push(paths.tag(tag)))
  })
}

export function* redirectHomeFromMissingProposition() {
  yield takeEvery(str(api.fetchPropositionJustifications.response), function* leaveMissingPropositionWorker(action) {
    if (action.error) {
      const routerLocation = history.location
      // Try to determine whether we are on the page for a proposition that was not found
      const path = paths.proposition({id: action.meta.requestPayload.propositionId})
      if (
        action.payload.httpStatusCode === httpStatusCodes.NOT_FOUND &&
        // startsWith because we don't have a slug
        routerLocation.pathname.startsWith(path)
      ) {
        yield put(ui.addToast(t(MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE)))
        yield put(push(paths.home()))
      }
    }
  })
}

export function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication() {
  yield takeEvery(LOCATION_CHANGE, function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthenticationWorker() {
    yield* tryWaitOnRehydrate()
    const isAuthenticated = isTruthy(yield select(selectAuthToken))
    const doesPathRequireAuthentication = () => some([
      routeIds.createProposition,
      routeIds.submit,
    ], isActivePath)
    if (!isAuthenticated && doesPathRequireAuthentication()) {
      const routerLocation = history.location
      yield put(goto.login(routerLocation))
    }
  })
}
