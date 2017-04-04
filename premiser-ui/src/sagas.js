import { put, call, take, takeEvery, takeLatest, select, race } from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import uuid from 'uuid'

import {
  API_RESOURCE_ACTIONS,
  FETCH_STATEMENTS,
  FETCH_STATEMENT_JUSTIFICATIONS,
  LOGIN,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  CALL_API,
  CALL_API_SUCCESS,
  CALL_API_FAILURE, LOGOUT_SUCCESS, LOGOUT_FAILURE, LOGOUT
} from "./actions";
import {fetchJson} from "./api";
import {assert, logError} from './util'
import {statementsSchema, statementJustificationsSchema} from './schemas'

const getAuthenticationToken = state => state.auth.authenticationToken

// These methods translate FETCH_* payloads into API calls
export const resourcePayloads = {
  [FETCH_STATEMENTS]: {
    endpoint: 'statements',
    schema: statementsSchema,
  },
  [FETCH_STATEMENT_JUSTIFICATIONS]: statementId => ({
    endpoint: `statements/${statementId}?justifications`,
    schema: statementJustificationsSchema,
  }),
}

function* callApi({type, payload: {endpoint, fetchInit = {}, schema}, meta: {nonce} = {}}) {
  try {
    assert(() => type === CALL_API)

    // Add authentication token to all API requests
    const authenticationToken = yield select(getAuthenticationToken)
    if (authenticationToken) {
      fetchInit = {...fetchInit,
        headers: {
          'Authorization': `Bearer ${authenticationToken}`,
        },
      }
    }

    // Prepare data submission
    if (fetchInit.body) {
      fetchInit = {...fetchInit,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fetchInit.body),
      }
    }

    const result = yield call(fetchJson, endpoint, {init: fetchInit, schema})
    yield put({type: CALL_API_SUCCESS, payload: result, meta: {nonce}})
  } catch (error) {
    logError(error)
    yield put({type: CALL_API_FAILURE, payload: error, meta: {nonce}})
  }
}

// function* callApiWithNonce(apiPayload) {
//   const nonce = uuid.v4()
//   yield put({type: CALL_API, payload: apiPayload, meta: {nonce}})
//   let successAction, failureAction
//   let complete = false
//   while (!complete) {
//     ({ successAction, failureAction } = {null, null})
//     ({ successAction, failureAction } = yield race({
//       successAction: take(CALL_API_SUCCESS),
//       failureAction: take(CALL_API_FAILURE)
//     }))
//     complete = successAction && successAction.meta.nonce === nonce ||
//         failureAction && failureAction.meta.nonce === nonce
//   }
//   return {successAction, failureAction}
// }

function* callApiForResource(fetchResourceAction) {
  try {
    let apiPayload = resourcePayloads[fetchResourceAction.type]
    if (isFunction(apiPayload)) {
      apiPayload = apiPayload(fetchResourceAction.payload)
    }

    // const {successAction, failureAction} = yield call(callApiWithNonce, apiPayload)

    const nonce = uuid.v4()
    yield put({type: CALL_API, payload: apiPayload, meta: {nonce}})

    let successAction, failureAction
    let complete = false
    while (!complete) {
      ({ successAction, failureAction } = yield race({
        successAction: take(CALL_API_SUCCESS),
        failureAction: take(CALL_API_FAILURE)
      }))
      complete = successAction && successAction.meta.nonce === nonce ||
              failureAction && failureAction.meta.nonce === nonce
    }

    if (successAction) {
      yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['SUCCESS'], payload: successAction.payload})
    } else if (failureAction) {
      yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: failureAction.payload})
    } else {
      const errorMessage = 'Both successAction and failureAction were falsy'
      logError(errorMessage)
      yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: new Error(errorMessage)})
    }

  } catch (error) {
    logError(error)
    yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: error})
  }
}

function* callApiForLogin(loginAction) {
  try {
    const apiPayload = {
      endpoint: 'login',
      fetchInit: {
        method: 'POST',
        body: loginAction.payload,
      }
    }
    const nonce = uuid.v4()
    yield put({type: CALL_API, payload: apiPayload, meta: {nonce}})

    let successAction, failureAction
    let complete = false
    while (!complete) {
      ({ successAction, failureAction } = yield race({
        successAction: take(CALL_API_SUCCESS, nonce),
        failureAction: take(CALL_API_FAILURE, nonce)
      }))
      complete = successAction && successAction.meta.nonce === nonce ||
          failureAction && failureAction.meta.nonce === nonce
    }

    if (successAction) {
      yield put({type: LOGIN_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: LOGIN_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: LOGIN_FAILURE, payload: error})
  }
}

function* callApiForLogout(logoutAction) {
  try {
    const apiPayload = {
      endpoint: 'logout',
      fetchInit: {
        method: 'POST',
      }
    }
    yield put({type: CALL_API, payload: apiPayload})
    const { successAction, failureAction } = yield race({
      successAction: take(CALL_API_SUCCESS),
      failureAction: take(CALL_API_FAILURE)
    })
    if (successAction) {
      yield put({type: LOGOUT_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: LOGOUT_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: LOGOUT_FAILURE, payload: error})
  }
}

function* watchFetchResources() {
  yield takeEvery([
    FETCH_STATEMENTS,
    FETCH_STATEMENT_JUSTIFICATIONS,
  ], callApiForResource)
}

function* watchLogin() {
  yield takeEvery(LOGIN, callApiForLogin)
}

function* watchLogout() {
  yield takeEvery(LOGOUT, callApiForLogout)
}

function* watchCallApi() {
  yield takeEvery(CALL_API, callApi)
}

export default () => [
  watchLogin(),
  watchLogout(),
  watchFetchResources(),
  watchCallApi(),
]