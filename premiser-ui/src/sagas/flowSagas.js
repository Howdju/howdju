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
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
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


export function* goHomeIfDeleteStatementWhileViewing() {
  yield takeEvery(str(api.deleteStatement.response), function* goHomeIfDeleteStatementWhileViewingWorker(action) {
    if (!action.error) {
      const routerLocation = history.location
      if (routerLocation.pathname === paths.statement(action.meta.requestPayload.statement)) {
        yield put(ui.addToast(t(DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE)))
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

    yield put(api.fetchStatementsSearch(mainSearchText))
  })

  yield takeEvery(str(goto.statement), function* goToStatementWorker(action) {
    const {statement} = action.payload
    yield put(push(paths.statement(statement)))
  })

  yield takeEvery(str(goto.tag), function* goToTagWorker(action) {
    const {
      tag
    } = action.payload
    yield put(push(paths.tag(tag)))
  })
}

export function* redirectHomeFromMissingStatement() {
  yield takeEvery(str(api.fetchStatementJustifications.response), function* leaveMissingStatementWorker(action) {
    if (action.error) {
      const routerLocation = history.location
      // Try to determine whether we are on the page for a statement that was not found
      const path = paths.statement({id: action.meta.requestPayload.statementId})
      if (
        action.payload.httpStatusCode === httpStatusCodes.NOT_FOUND &&
        // startsWith because we don't have a slug
        routerLocation.pathname.startsWith(path)
      ) {
        yield put(ui.addToast(t(MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE)))
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
      routeIds.createStatement,
      routeIds.submit,
    ], isActivePath)
    if (!isAuthenticated && doesPathRequireAuthentication()) {
      const routerLocation = history.location
      yield put(goto.login(routerLocation))
    }
  })
}
