import { put, call, take, takeEvery, takeLatest, select, race } from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import uuid from 'uuid'
import {REHYDRATE} from 'redux-persist/constants'
import {push} from 'react-router-redux'
import text, {
  CREATE_EXTANT_STATEMENT_TOAST_MESSAGE, CREATE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE, MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE, UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE
} from './texts'

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
  UN_DISVERIFY_JUSTIFICATION_SUCCESS, LOGIN_REDIRECT, CREATE_STATEMENT_SUCCESS, CREATE_STATEMENT_FAILURE,
  CREATE_STATEMENT, DELETE_STATEMENT_SUCCESS, DELETE_STATEMENT_FAILURE, DELETE_STATEMENT,
  FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS, CREATE_JUSTIFICATION,
  CREATE_JUSTIFICATION_SUCCESS, CREATE_JUSTIFICATION_FAILURE, DELETE_JUSTIFICATION, DELETE_JUSTIFICATION_FAILURE,
  DELETE_JUSTIFICATION_SUCCESS, HIDE_ADD_NEW_JUSTIFICATION, RESET_NEW_JUSTIFICATION, DO_MAIN_SEARCH,
  FETCH_STATEMENTS_SEARCH, FETCH_STATEMENTS_SEARCH_SUCCESS, FETCH_STATEMENTS_SEARCH_FAILURE, fetchStatementsSearch,
  mainSearchTextChange, INITIALIZE_MAIN_SEARCH, REFRESH_MAIN_SEARCH_AUTOCOMPLETE, FETCH_MAIN_SEARCH_AUTOCOMPLETE,
  FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS, FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE, VIEW_STATEMENT,
  FETCH_CREATE_STATEMENT_TEXT_AUTOCOMPLETE_FAILURE, FETCH_CREATE_STATEMENT_TEXT_AUTOCOMPLETE_SUCCESS,
  FETCH_CREATE_STATEMENT_TEXT_AUTOCOMPLETE, FETCH_STATEMENT_SUGGESTIONS_SUCCESS, FETCH_STATEMENT_SUGGESTIONS_FAILURE,
  FETCH_STATEMENT_SUGGESTIONS,
} from "./actions";
import {fetchJson} from "./api";
import {assert, logError, logger} from './util'
import {
  statementsSchema, statementJustificationsSchema, voteSchema, statementSchema,
  justificationSchema
} from './schemas'
import {VotePolarity, VoteTargetType} from "./models";
import paths from "./paths";
import {DELETE_STATEMENT_FAILURE_TOAST_MESSAGE, LOGIN_SUCCESS_TOAST_MESSAGE} from "./texts";
import mainSearcher from './mainSearcher'

const POST = 'POST'
const DELETE = 'DELETE'
const UNAUTHORIZED = 401
const NOT_FOUND = 404

const getAuthToken = state => {
  return state.auth.authToken
}

const getRouterLocation = state => state.router.location
const getLoginRedirectLocation = state => state.app.loginRedirectLocation
const getCounterJustification = targetJustificationId => state =>
    state.ui.statementJustificationsPage.newCounterJustificationsByTargetId[targetJustificationId]

let isRehydrated = false

// These methods translate FETCH_* payloads into API calls
export const resourceApiConfigs = {
  [FETCH_STATEMENTS]: {
    payload: {
      endpoint: 'statements',
      schema: statementsSchema,
    }
  },
}

function* callApi({type, payload: {endpoint, fetchInit = {}, schema}, meta: {nonce, requiresRehydrate}}) {
  try {
    assert(() => type === CALL_API)

    if (requiresRehydrate && !isRehydrated) {
      yield take(REHYDRATE)
    }

    let fetchInitUpdate = {}

    // Add auth token to all API requests
    const authToken = yield select(getAuthToken)
    if (authToken) {
      fetchInitUpdate.headers = merge({}, fetchInitUpdate.headers, {
        'Authorization': `Bearer ${authToken}`,
      })
    }

    // Prepare data submission
    if (fetchInit.body) {
      fetchInitUpdate.headers = merge({}, fetchInitUpdate.headers, {
        'Content-Type': 'application/json',
      })

      fetchInitUpdate.body = JSON.stringify(fetchInit.body)
    }

    fetchInit = merge({}, fetchInit, fetchInitUpdate)

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
          failureToastText: text(VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE),
        }
      case UN_VERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.POSITIVE,
          method: DELETE,
          successType: UN_VERIFY_JUSTIFICATION_SUCCESS,
          failureType: UN_VERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE) ,
        }
      case DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: POST,
          successType: DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: DISVERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE),
        }
      case UN_DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: DELETE,
          successType: UN_DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: UN_DISVERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE),
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

function* callApiForFetchStatementJustifications(action) {
  const statementId = action.payload.statementId
  try {
    const payload = {
      endpoint: `statements/${statementId}?justifications`,
      schema: statementJustificationsSchema,
    }
    const meta = {
      requiresRehydrate: true,
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload, meta})()

    if (successAction) {
      yield put({type: FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, payload: failureAction.payload, meta: {statementId}})
    }
  } catch (error) {
    logError(error)
    yield put({type: FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, payload: error, meta: {statementId}})
  }
}

function* callApiForFetchStatementsSearch(action) {
  const searchText = action.payload.searchText
  try {
    const payload = {
      endpoint: `search-statements?searchText=${searchText}`,
      schema: [statementSchema],
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: FETCH_STATEMENTS_SEARCH_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: FETCH_STATEMENTS_SEARCH_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: FETCH_STATEMENTS_SEARCH_FAILURE, payload: error})
  }
}
function* callApiForFetchMainSearchAutocomplete(action) {
  const searchText = action.payload.searchText
  try {
    const payload = {
      endpoint: `search-statements?searchText=${searchText}`,
      schema: [statementSchema],
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE, payload: error})
  }
}
function* callApiForFetchStatementSuggestions(action) {
  const text = action.payload.text
  try {
    const payload = {
      endpoint: `search-statements?searchText=${text}`,
      schema: [statementSchema],
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      const meta = {
        suggestionsKey: action.payload.suggestionsKey
      }
      yield put({type: FETCH_STATEMENT_SUGGESTIONS_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: FETCH_STATEMENT_SUGGESTIONS_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: FETCH_STATEMENT_SUGGESTIONS_FAILURE, payload: error})
  }
}

function* onCreateStatement(action) {
  try {
    const payload = {
      endpoint: 'statements',
      fetchInit: {
        method: POST,
        body: action.payload
      },
      schema: {statement: statementSchema}
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: CREATE_STATEMENT_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: CREATE_STATEMENT_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: CREATE_STATEMENT_FAILURE, payload: error})
  }
}

function* onCreateJustification(action) {
  try {

    const payload = {
      endpoint: 'justifications',
      fetchInit: {
        method: POST,
        body: action.payload
      },
      schema: {justification: justificationSchema}
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: CREATE_JUSTIFICATION_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: CREATE_JUSTIFICATION_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: CREATE_JUSTIFICATION_FAILURE, payload: error})
  }
}

function* onCreateJustificationSuccess(action) {
  yield put({type: HIDE_ADD_NEW_JUSTIFICATION})
  yield put({type: RESET_NEW_JUSTIFICATION})
}

function* onCreateJustificationFailure(action) {
  yield put({type: ADD_TOAST, payload: { text: text(CREATE_JUSTIFICATION_FAILURE_TOAST_MESSAGE)}})
}

function* onDeleteJustification(action) {
  const {justification} = action.payload
  const meta = {
    deletedEntity: justification
  }
  try {
    const payload = {
      endpoint: `justifications/${justification.id}`,
      fetchInit: {
        method: DELETE,
      },
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: DELETE_JUSTIFICATION_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: DELETE_JUSTIFICATION_FAILURE, payload: failureAction.payload, meta})
    }
  } catch (error) {
    logError(error)
    yield put({type: DELETE_JUSTIFICATION_FAILURE, payload: error, meta})
  }
}

function* onDeleteJustificationFailure(action) {
  yield put({type: ADD_TOAST, payload: { text: text(DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE)}})
}

function* onDeleteStatement(action) {
  const {statement} = action.payload
  const meta = {
    deletedEntity: statement
  }
  try {
    const payload = {
      endpoint: `statements/${statement.id}`,
      fetchInit: {
        method: DELETE,
      },
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: DELETE_STATEMENT_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: DELETE_STATEMENT_FAILURE, payload: failureAction.payload, meta})
    }
  } catch (error) {
    logError(error)
    yield put({type: DELETE_STATEMENT_FAILURE, payload: error, meta})
  }
}

function* onDeleteStatementSuccess(action) {
  const routerLocation = yield select(getRouterLocation)
  if (routerLocation.pathname === paths.statement(action.meta.deletedStatement)) {
    yield put({type: ADD_TOAST, payload: { text: text(DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE)}})
    yield put(push(paths.home()))
  }
}

function* onFetchStatementJustificationsFailure(action) {
  const routerLocation = yield select(getRouterLocation)
  // Try to determine whether we are on the page for a statement that was not found
  const path = paths.statement({id: action.meta.statementId})
  if (
      action.payload.status === NOT_FOUND &&
      // startsWith because we don't have a slug
      routerLocation.pathname.startsWith(path)
  ) {
    yield put({type: ADD_TOAST, payload: { text: text(MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE)}})
    yield put(push(paths.home()))
  }
}

function* onDeleteStatementFailure(action) {
  yield put({type: ADD_TOAST, payload: { text: text(DELETE_STATEMENT_FAILURE_TOAST_MESSAGE)}})
}

function* onCallApiFailure(action) {
  if (action.payload.status === UNAUTHORIZED) {
    const routerLocation = yield select(getRouterLocation)
    yield put({type: LOGIN_REDIRECT, payload: {routerLocation}})
  }
}

function* onLoginRedirect(action) {
  yield put(push(paths.login()))
}

function* onLoginSuccess(action) {
  yield put({type: ADD_TOAST, payload: { text: text(LOGIN_SUCCESS_TOAST_MESSAGE, action.payload.email)}})
  const loginRedirectLocation = yield select(getLoginRedirectLocation)
  const location = loginRedirectLocation || paths.home()
  yield put(push(location))
}

function* onCreateStatementSuccess(action) {
  if (action.payload.isExtant) {
    yield put({type: ADD_TOAST, payload: { text: text(CREATE_EXTANT_STATEMENT_TOAST_MESSAGE)}})
  }
  const statement = action.payload.entities.statements[action.payload.result.statement]
  yield put(push(paths.statement(statement)))
}

function* onDoMainSearch(action) {
  const mainSearchPath = paths.mainSearch(action.payload.mainSearchText)
  const routerLocation = yield select(getRouterLocation)
  const routerMainSearchText = mainSearcher.mainSearchText(routerLocation)
  const urlSearchText = paths.mainSearch(routerMainSearchText)
  if (urlSearchText !== mainSearchPath) {
    yield put(push(mainSearchPath))
  }
  yield put(fetchStatementsSearch(action.payload.mainSearchText))
}

function* onInitializeMainSearch(action) {
  yield put(mainSearchTextChange(action.payload.searchText))
  yield put(fetchStatementsSearch(action.payload.searchText))
}

function* watchFetchResources() {
  yield takeEvery([
    FETCH_STATEMENTS,
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

function* onViewStatement(action) {
  yield put(push(paths.statement(action.payload.statement)))
}

function* watchFetchStatementJustifications() {
  yield takeEvery(FETCH_STATEMENT_JUSTIFICATIONS, callApiForFetchStatementJustifications)
}

function* watchLogin() {
  yield takeEvery(LOGIN, callApiForLogin)
}

function* watchLoginSuccess() {
  yield takeEvery(LOGIN_SUCCESS, onLoginSuccess)
}

function* watchCreateStatementSuccess() {
  yield takeEvery(CREATE_STATEMENT_SUCCESS, onCreateStatementSuccess)
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

function* watchCreateStatement() {
  yield takeEvery(CREATE_STATEMENT, onCreateStatement)
}

function* watchDeleteStatement() {
  yield takeEvery(DELETE_STATEMENT, onDeleteStatement)
}

function* watchDeleteStatementSuccess() {
  yield takeEvery(DELETE_STATEMENT_SUCCESS, onDeleteStatementSuccess)
}

function* watchDeleteStatementFailure() {
  yield takeEvery(DELETE_STATEMENT_FAILURE, onDeleteStatementFailure)
}

function* watchFetchStatementJustificationsFailure() {
  yield takeEvery(FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, onFetchStatementJustificationsFailure)
}

function* watchCreateJustification() {
  yield takeEvery(CREATE_JUSTIFICATION, onCreateJustification)
}

function* watchCreateJustificationSuccess() {
  yield takeEvery(CREATE_JUSTIFICATION_SUCCESS, onCreateJustificationSuccess)
}

function* watchCreateJustificationFailure() {
  yield takeEvery(CREATE_JUSTIFICATION_FAILURE, onCreateJustificationFailure)
}

function* watchDeleteJustificationFailure() {
  yield takeEvery(DELETE_JUSTIFICATION_FAILURE, onDeleteJustificationFailure)
}

function* watchDeleteJustification() {
  yield takeEvery(DELETE_JUSTIFICATION, onDeleteJustification)
}

function* watchRehydrate() {
  yield takeEvery(REHYDRATE, recordRehydrate)
}

function* watchDoMainSearch() {
  yield takeEvery(DO_MAIN_SEARCH, onDoMainSearch)
}

function* watchFetchStatementsSearch() {
  yield takeEvery(FETCH_STATEMENTS_SEARCH, callApiForFetchStatementsSearch)
}

function* watchInitializeMainSearch() {
  yield takeEvery(INITIALIZE_MAIN_SEARCH, onInitializeMainSearch)
}

function* watchFetchMainSearchAutocomplete() {
  yield takeEvery(FETCH_MAIN_SEARCH_AUTOCOMPLETE, callApiForFetchMainSearchAutocomplete)
}

function* watchViewStatement() {
  yield takeEvery(VIEW_STATEMENT, onViewStatement)
}

function* watchFetchStatementSuggestions() {
  yield takeEvery(FETCH_STATEMENT_SUGGESTIONS, callApiForFetchStatementSuggestions)
}

export default () => [
  watchLogin(),
  watchLoginSuccess(),
  watchLogout(),
  watchFetchResources(),
  watchFetchStatementJustifications(),
  watchFetchStatementJustificationsFailure(),
  watchCallApi(),
  watchCallApiFailure(),
  watchLoginRedirect(),
  watchVotes(),
  watchRehydrate(),
  watchCreateStatement(),
  watchCreateStatementSuccess(),
  watchDeleteStatement(),
  watchDeleteStatementSuccess(),
  watchDeleteStatementFailure(),
  watchCreateJustification(),
  watchCreateJustificationSuccess(),
  watchCreateJustificationFailure(),
  watchDeleteJustification(),
  watchDeleteJustificationFailure(),
  watchDoMainSearch(),
  watchFetchStatementsSearch(),
  watchInitializeMainSearch(),
  watchFetchMainSearchAutocomplete(),
  watchViewStatement(),
  watchFetchStatementSuggestions(),
]