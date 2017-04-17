import { put, call, take, takeEvery, takeLatest, select, race } from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import uuid from 'uuid'
import {REHYDRATE} from 'redux-persist/constants'
import {push} from 'react-router-redux'
import {paths} from './App'

import {
  API_RESOURCE_ACTIONS,
  FETCH_STATEMENTS,
  FETCH_STATEMENT_JUSTIFICATIONS,
  LOGIN,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  CALL_API,
  CALL_API_SUCCESS,
  CALL_API_FAILURE, LOGOUT_SUCCESS, LOGOUT_FAILURE, LOGOUT, ADD_TOAST, VERIFY_JUSTIFICATION,
  VERIFY_JUSTIFICATION_SUCCESS, VERIFY_JUSTIFICATION_FAILURE, UN_VERIFY_JUSTIFICATION, DISVERIFY_JUSTIFICATION,
  UN_DISVERIFY_JUSTIFICATION, UN_VERIFY_JUSTIFICATION_SUCCESS, UN_VERIFY_JUSTIFICATION_FAILURE,
  DISVERIFY_JUSTIFICATION_SUCCESS, DISVERIFY_JUSTIFICATION_FAILURE, UN_DISVERIFY_JUSTIFICATION_FAILURE,
  UN_DISVERIFY_JUSTIFICATION_SUCCESS, LOGIN_REDIRECT
} from "./actions";
import {fetchJson} from "./api";
import {assert, logError} from './util'
import {statementsSchema, statementJustificationsSchema, voteSchema} from './schemas'
import {VotePolarity, VoteTargetType} from "./models";

const POST = 'POST'
const DELETE = 'DELETE'
const UNAUTHORIZED = 401

const getAuthToken = state => {
  return state.auth.authToken
}

const getRouterLocation = state => state.router.location
const getLoginRedirectLocation = state => state.app.loginRedirectLocation

let isRehydrated = false

// These methods translate FETCH_* payloads into API calls
export const resourceApiConfigs = {
  [FETCH_STATEMENTS]: {
    payload: {
      endpoint: 'statements',
      schema: statementsSchema,
    }
  },
  [FETCH_STATEMENT_JUSTIFICATIONS]: statementId => ({
    payload: {
      endpoint: `statements/${statementId}?justifications`,
      schema: statementJustificationsSchema,
    },
    meta: {
      requiresRehydrate: true,
    }
  }),
}

function* callApi({type, payload: {endpoint, fetchInit = {}, schema}, meta: {nonce, requiresRehydrate}}) {
  try {
    assert(() => type === CALL_API)

    if (requiresRehydrate && !isRehydrated) {
      yield take(REHYDRATE)
    }

    // Add auth token to all API requests
    const authToken = yield select(getAuthToken)
    if (authToken) {
      fetchInit.headers = merge({}, fetchInit.headers, {
        'Authorization': `Bearer ${authToken}`,
      })
    }

    // Prepare data submission
    if (fetchInit.body) {
      fetchInit.headers = merge({}, fetchInit.headers, {
        'Content-Type': 'application/json',
      })
      fetchInit.body = JSON.stringify(fetchInit.body)
    }

    const result = yield call(fetchJson, endpoint, {init: fetchInit, schema})
    yield put({type: CALL_API_SUCCESS, payload: result, meta: {nonce}})
  } catch (error) {
    logError(error)
    yield put({type: CALL_API_FAILURE, payload: error, meta: {nonce}})
  }
}

/** Adds a nonce to the meta of an API call to ensure that the API success/failure corresponds to this call */
const callApiWithNonce = ({payload, meta}) => function* () {
  const nonce = uuid.v4()
  meta = merge({}, meta, {nonce})
  yield put({type: CALL_API, payload, meta})

  let successAction, failureAction
  let isComplete = false
  while (!isComplete) {
    // If the take picked up an action with the incorrect nonce from a previous loop iteration, clear it out
    successAction = failureAction = null;
    ({ successAction, failureAction } = yield race({
      successAction: take(CALL_API_SUCCESS),
      failureAction: take(CALL_API_FAILURE)
    }))
    isComplete = successAction && successAction.meta.nonce === nonce ||
        failureAction && failureAction.meta.nonce === nonce
  }

  return {
    successAction,
    failureAction
  }
}

function* callApiForResource(fetchResourceAction) {
  try {
    let config = resourceApiConfigs[fetchResourceAction.type]
    const {payload, meta} = isFunction(config) ? config(fetchResourceAction.payload) : config

    const {successAction, failureAction} = yield* callApiWithNonce({payload, meta})()

    if (successAction) {
      yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['SUCCESS'], payload: successAction.payload})
    } else {
      yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: error})
  }
}

/** Factory for API calling sagas with known success/failure types
 * @param payloadCreator - Either a static payload for the API action or a function that will be called with the
 *                            saga's action and that returns the payload for the API action
 */
const apiCaller = ({successType, failureType}, payloadCreator) => function* (action) {
  try {
    const payload = isFunction(payloadCreator) ? payloadCreator(action) : payloadCreator

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: successType, payload: successAction.payload})
    } else {
      yield put({type: failureType, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: failureType, payload: error})
  }
}

const callApiForLogin = apiCaller({successType: LOGIN_SUCCESS, failureType: LOGIN_FAILURE}, action => ({
  endpoint: 'login',
  fetchInit: {
    method: POST,
    body: action.payload,
  }
}))

const callApiForLogout = apiCaller({successType: LOGOUT_SUCCESS, failureType: LOGOUT_FAILURE}, {
  endpoint: 'logout',
  fetchInit: {
    method: POST,
  }
})

function* callApiForVote({type, payload: {target}}) {
  const configure = () => {
    switch (type) {
      case VERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.POSITIVE,
          method: POST,
          successType: VERIFY_JUSTIFICATION_SUCCESS,
          failureType: VERIFY_JUSTIFICATION_FAILURE,
          failureToastText: 'Verification failed.',
        }
      case UN_VERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.POSITIVE,
          method: DELETE,
          successType: UN_VERIFY_JUSTIFICATION_SUCCESS,
          failureType: UN_VERIFY_JUSTIFICATION_FAILURE,
          failureToastText: 'Removing verification failed.',
        }
      case DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: POST,
          successType: DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: DISVERIFY_JUSTIFICATION_FAILURE,
          failureToastText: 'Disverification failed.',
        }
      case UN_DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: DELETE,
          successType: UN_DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: UN_DISVERIFY_JUSTIFICATION_FAILURE,
          failureToastText: 'Removing disverification failed.',
        }
    }
  }

  const {targetType, polarity, method, successType, failureType, failureToastText} = configure()
  const meta = {originalTarget: target}

  try {

    const payload = {
      endpoint: 'votes',
      fetchInit: {
        method,
        body: {
          targetType,
          targetId: target.id,
          polarity,
        }
      },
      schema: voteSchema
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: successType, payload: successAction.payload, meta})
    } else {
      yield put({type: failureType, payload: failureAction.payload, meta})
      yield put({type: ADD_TOAST, payload: { text: failureToastText}})
    }
  } catch (error) {
    logError(error)
    yield put({type: failureType, payload: error, meta})
  }
}

function* callApiForVerifyJustification(action) {
  const justification = action.payload.target
  try {
    const payload = {
      endpoint: `justifications/${justification.id}/verifications`,
      fetchInit: {
        method: POST,
      }
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: VERIFY_JUSTIFICATION_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: VERIFY_JUSTIFICATION_FAILURE, payload: failureAction.payload, meta: {originalTarget: justification}})
      yield put({type: ADD_TOAST, payload: { text: `Verification failed.`}})
    }
  } catch (error) {
    logError(error)
    yield put({type: VERIFY_JUSTIFICATION_FAILURE, payload: error, meta: {originalTarget: justification}})
  }
}

function* onCallApiFailure(action) {
  if (action.payload.status === UNAUTHORIZED) {
    const routerLocation = yield select(getRouterLocation)
    yield put({type: LOGIN_REDIRECT, payload: {routerLocation}})
  }
}

function* onLoginRedirect(action) {
  yield put(push(paths.login))
}

function* onLoginSuccess(action) {
  yield put({type: ADD_TOAST, payload: { text: `You have logged in as ${action.payload.email}`}})
  const loginRedirectLocation = yield select(getLoginRedirectLocation)
  const location = loginRedirectLocation || paths.home
  yield put(push(location))
}

function* watchFetchResources() {
  yield takeEvery([
    FETCH_STATEMENTS,
    FETCH_STATEMENT_JUSTIFICATIONS,
  ], callApiForResource)
}

function* recordRehydrate() {
  isRehydrated = true
}

function* watchVotes() {
  yield takeEvery([
      VERIFY_JUSTIFICATION,
      UN_VERIFY_JUSTIFICATION,
      DISVERIFY_JUSTIFICATION,
      UN_DISVERIFY_JUSTIFICATION,
  ], callApiForVote)
}

function* watchLogin() {
  yield takeEvery(LOGIN, callApiForLogin)
}

function* watchLoginSuccess() {
  yield takeEvery(LOGIN_SUCCESS, onLoginSuccess)
}

function* watchLogout() {
  yield takeEvery(LOGOUT, callApiForLogout)
}

function* watchCallApi() {
  yield takeEvery(CALL_API, callApi)
}

function* watchCallApiFailure() {
  yield takeEvery(CALL_API_FAILURE, onCallApiFailure)
}

function* watchLoginRedirect() {
  yield takeEvery(LOGIN_REDIRECT, onLoginRedirect)
}

function* watchRehydrate() {
  yield takeEvery(REHYDRATE, recordRehydrate)
}

export default () => [
  watchLogin(),
  watchLoginSuccess(),
  watchLogout(),
  watchFetchResources(),
  watchCallApi(),
  watchCallApiFailure(),
  watchLoginRedirect(),
  watchVotes(),
  watchRehydrate(),
]