import some from 'lodash/some'
import {
  put,
  takeEvery,
  select,
} from 'redux-saga/effects'
import {LOCATION_CHANGE, push, replace} from 'connected-react-router'

import {
  httpStatusCodes,
  JustificationRootTargetType,
  newExhaustedEnumError,
  utcNowIsAfter,
} from 'howdju-common'

import t, {
  DELETE_PROPOSITION_SUCCESS_TOAST_MESSAGE,
  MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
} from '../texts'
import paths from "../paths"
import mainSearcher from '../mainSearcher'
import {
  selectAuthTokenExpiration,
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
      const noSlugPath = paths.proposition(action.meta.requestPayload.proposition, null, true)
      if (routerLocation.pathname.startsWith(noSlugPath)) {
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

  yield takeEvery(str(goto.justification), function* goToJustificationWorker(action) {
    const {justification} = action.payload
    yield put(push(paths.justification(justification)))
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

  yield takeEvery(str(goto.writQuote), function* goToWritQuoteWorker(action) {
    const {writQuote} = action.payload
    yield put(push(paths.writQuote(writQuote)))
  })
}

export function* redirectHomeFromMissingRootTarget() {
  yield takeEvery(str(api.fetchRootJustificationTarget.response), function* redirectHomeFromMissingRootTargetWorker(action) {
    // Try to determine whether we are on the page for a proposition that was not found
    if (action.error && action.payload.httpStatusCode === httpStatusCodes.NOT_FOUND) {
      const {
        rootTargetType,
        rootTargetId,
      } = action.meta.requestPayload

      const routerLocation = history.location

      let path, messageKey
      switch (rootTargetType) {
        case JustificationRootTargetType.PROPOSITION:
          path = paths.proposition({id: rootTargetId})
          messageKey = MISSING_PROPOSITION_REDIRECT_TOAST_MESSAGE
          break
        case JustificationRootTargetType.STATEMENT:
          path = paths.statement({id: rootTargetId})
          messageKey = MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE
          break
        default:
          throw newExhaustedEnumError('JustificationRootTargetType')
      }
      // startsWith because we don't have a slug
      if (routerLocation.pathname.startsWith(path)) {
        yield put(ui.addToast(t(messageKey)))
        yield put(push(paths.home()))
      }
    }
  })
}

export function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthentication() {
  yield takeEvery(LOCATION_CHANGE, function* redirectUnauthenticatedUserToLoginOnPagesNeedingAuthenticationWorker() {
    yield* tryWaitOnRehydrate()
    const authTokenExpiration = yield select(selectAuthTokenExpiration)
    const isExpired = dateTimeString => utcNowIsAfter(dateTimeString)
    const isAuthenticated = authTokenExpiration && !isExpired(authTokenExpiration)
    const doesPathRequireAuthentication = some([
      routeIds.submitSourceExcerpt,
      routeIds.createProposition,
      routeIds.createJustification,
      routeIds.submitJustificationViaQueryString,
    ], isActivePath)
    if (!isAuthenticated && doesPathRequireAuthentication) {
      const loginRedirectLocation = history.location
      yield put(goto.login(loginRedirectLocation))
    }
  })
}
