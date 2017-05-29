import { put, call, take, takeEvery, select, race } from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import uuid from 'uuid'
import {REHYDRATE} from 'redux-persist/constants'
import {LOCATION_CHANGE, push, replace} from 'react-router-redux'
import text, {
  CREATE_EXTANT_STATEMENT_TOAST_MESSAGE, CREATE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE, MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE, UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE
} from './texts'

import * as actions from "./actions";
import {fetchJson} from "./api";
import {assert, logError} from './util'
import {
  statementsSchema, statementJustificationsSchema, voteSchema, statementSchema,
  justificationSchema, citationReferenceSchema
} from './schemas'
import {VotePolarity, VoteTargetType} from "./models";
import paths from "./paths";
import {DELETE_STATEMENT_FAILURE_TOAST_MESSAGE, LOGIN_SUCCESS_TOAST_MESSAGE} from "./texts";
import mainSearcher from './mainSearcher'
import * as httpMethods from './httpMethods'
import * as httpStatuses from './httpStatuses'
import {denormalize} from "normalizr";

const getAuthToken = state => {
  return state.auth.authToken
}

const getRouterLocation = state => state.router.location
const getLoginRedirectLocation = state => state.app.loginRedirectLocation
const getCounterJustification = targetJustificationId => state =>
    state.ui.statementJustificationsPage.newCounterJustificationsByTargetId[targetJustificationId]

// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false

// These methods translate FETCH_* payloads into API calls
export const resourceApiConfigs = {
  [actions.FETCH_STATEMENTS]: {
    payload: {
      endpoint: 'statements',
      schema: statementsSchema,
    }
  },
  [actions.UPDATE_CITATION_REFERENCE]: payload => ({
    payload: {
      endpoint: `citation-references/${payload.citationReference.id}`,
      fetchInit: {
        method: httpMethods.PUT,
        body: payload
      },
      schema: {
        citationReference: citationReferenceSchema
      },
    }
  })
}

function* callApi({type, payload: {endpoint, fetchInit = {}, schema}, meta: {nonce, requiresRehydrate}}) {
  try {
    assert(() => type === actions.CALL_API)

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
    yield put({type: actions.CALL_API_SUCCESS, payload: result, meta: {nonce}})
  } catch (error) {
    yield put({type: actions.CALL_API_FAILURE, payload: error, meta: {nonce}})
  }
}

/** Adds a nonce to the meta of an API call to ensure that the API success/failure corresponds to this call */
const callApiWithNonce = ({payload, meta}) => function* () {
  const nonce = uuid.v4()
  meta = merge({}, meta, {nonce})
  yield put({type: actions.CALL_API, payload, meta})

  let successAction, failureAction
  let isComplete = false
  while (!isComplete) {
    // If the take picked up an action with the incorrect nonce from a previous loop iteration, clear it out
    successAction = failureAction = null;
    ({ successAction, failureAction } = yield race({
      successAction: take(actions.CALL_API_SUCCESS),
      failureAction: take(actions.CALL_API_FAILURE)
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
      const meta = {
        onSuccess: fetchResourceAction.onSuccess,
        schema: payload.schema,
      }
      yield put({type: actions.API_RESOURCE_ACTIONS[fetchResourceAction.type]['SUCCESS'], payload: successAction.payload, meta})
    } else {
      yield put({type: actions.API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.API_RESOURCE_ACTIONS[fetchResourceAction.type]['FAILURE'], payload: error})
  }
}

/** Factory for API calling sagas with known success/failure types
 * @param successType - The action type to use upon success
 * @param failureType - The action type to use upon failure
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

const callApiForLogin = apiCaller({successType: actions.LOGIN_SUCCESS, failureType: actions.LOGIN_FAILURE}, action => ({
  endpoint: 'login',
  fetchInit: {
    method: httpMethods.POST,
    body: action.payload,
  }
}))

const callApiForLogout = apiCaller({successType: actions.LOGOUT_SUCCESS, failureType: actions.LOGOUT_FAILURE}, {
  endpoint: 'logout',
  fetchInit: {
    method: httpMethods.POST,
  }
})

function* callApiForVote({type, payload: {target}}) {
  const configure = () => {
    switch (type) {
      case actions.VERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.POSITIVE,
          method: httpMethods.POST,
          successType: actions.VERIFY_JUSTIFICATION_SUCCESS,
          failureType: actions.VERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE),
        }
      case actions.UN_VERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.POSITIVE,
          method: httpMethods.DELETE,
          successType: actions.UN_VERIFY_JUSTIFICATION_SUCCESS,
          failureType: actions.UN_VERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE) ,
        }
      case actions.DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: httpMethods.POST,
          successType: actions.DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: actions.DISVERIFY_JUSTIFICATION_FAILURE,
          failureToastText: text(DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE),
        }
      case actions.UN_DISVERIFY_JUSTIFICATION:
        return {
          targetType: VoteTargetType.JUSTIFICATION,
          polarity: VotePolarity.NEGATIVE,
          method: httpMethods.DELETE,
          successType: actions.UN_DISVERIFY_JUSTIFICATION_SUCCESS,
          failureType: actions.UN_DISVERIFY_JUSTIFICATION_FAILURE,
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
      yield put({type: actions.ADD_TOAST, payload: { text: failureToastText}})
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
      yield put({type: actions.FETCH_STATEMENT_JUSTIFICATIONS_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, payload: failureAction.payload, meta: {statementId}})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, payload: error, meta: {statementId}})
  }
}

function* callApiForFetchStatementForEdit(action) {
  const statementId = action.payload.statementId
  try {
    const payload = {
      endpoint: `statements/${statementId}`,
      schema: {
        statement: statementSchema
      },
    }
    const meta = {
      requiresRehydrate: true,
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload, meta})()

    if (successAction) {
      yield put({type: actions.FETCH_STATEMENT_SUCCESS, payload: successAction.payload})
      yield put({type: actions.FETCH_STATEMENT_FOR_EDIT_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.FETCH_STATEMENT_FAILURE, payload: failureAction.payload})
      yield put({type: actions.FETCH_STATEMENT_FOR_EDIT_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.FETCH_STATEMENT_FAILURE, payload: error})
    yield put({type: actions.FETCH_STATEMENT_FOR_EDIT_FAILURE, payload: error})
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
      yield put({type: actions.FETCH_STATEMENTS_SEARCH_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.FETCH_STATEMENTS_SEARCH_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.FETCH_STATEMENTS_SEARCH_FAILURE, payload: error})
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
      yield put({type: actions.FETCH_MAIN_SEARCH_AUTOCOMPLETE_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.FETCH_MAIN_SEARCH_AUTOCOMPLETE_FAILURE, payload: error})
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
      yield put({type: actions.FETCH_STATEMENT_SUGGESTIONS_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: actions.FETCH_STATEMENT_SUGGESTIONS_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.FETCH_STATEMENT_SUGGESTIONS_FAILURE, payload: error})
  }
}

function* onCreateStatement(action) {
  try {
    const payload = {
      endpoint: 'statements',
      fetchInit: {
        method: httpMethods.POST,
        body: action.payload
      },
      schema: {
        statement: statementSchema,
      }
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      const meta = {
        onSuccess: action.onSuccess
      }
      yield put({type: actions.CREATE_STATEMENT_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: actions.CREATE_STATEMENT_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.CREATE_STATEMENT_FAILURE, payload: error})
  }
}
function* onCreateStatementJustification(action) {
  try {
    const payload = {
      endpoint: 'statements',
      fetchInit: {
        method: httpMethods.POST,
        body: action.payload
      },
      schema: {
        statement: statementSchema,
        justification: justificationSchema,
      }
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: actions.CREATE_STATEMENT_JUSTIFICATION_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.CREATE_STATEMENT_JUSTIFICATION_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.CREATE_STATEMENT_JUSTIFICATION_FAILURE, payload: error})
  }
}

function* onUpdateStatement(action) {
  try {
    const {statement} = action.payload
    const payload = {
      endpoint: `statements/${statement.id}`,
      fetchInit: {
        method: httpMethods.PUT,
        body: {statement}
      },
      schema: {
        statement: statementSchema,
      }
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: actions.UPDATE_STATEMENT_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.UPDATE_STATEMENT_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.UPDATE_STATEMENT_FAILURE, payload: error})
  }
}



function* onCreateJustification(action) {
  try {

    const payload = {
      endpoint: 'justifications',
      fetchInit: {
        method: httpMethods.POST,
        body: action.payload
      },
      schema: {justification: justificationSchema}
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: actions.CREATE_JUSTIFICATION_SUCCESS, payload: successAction.payload})
    } else {
      yield put({type: actions.CREATE_JUSTIFICATION_FAILURE, payload: failureAction.payload})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.CREATE_JUSTIFICATION_FAILURE, payload: error})
  }
}

function* onCreateJustificationSuccess(action) {
  yield put({type: actions.HIDE_NEW_JUSTIFICATION_DIALOG})
  yield put({type: actions.RESET_EDIT_JUSTIFICATION})
}

function* onCreateJustificationFailure(action) {
  yield put({type: actions.ADD_TOAST, payload: { text: text(CREATE_JUSTIFICATION_FAILURE_TOAST_MESSAGE)}})
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
        method: httpMethods.DELETE,
      },
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: actions.DELETE_JUSTIFICATION_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: actions.DELETE_JUSTIFICATION_FAILURE, payload: failureAction.payload, meta})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.DELETE_JUSTIFICATION_FAILURE, payload: error, meta})
  }
}

function* onDeleteJustificationFailure(action) {
  yield put({type: actions.ADD_TOAST, payload: { text: text(DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE)}})
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
        method: httpMethods.DELETE,
      },
    }

    const {successAction, failureAction} = yield* callApiWithNonce({payload})()

    if (successAction) {
      yield put({type: actions.DELETE_STATEMENT_SUCCESS, payload: successAction.payload, meta})
    } else {
      yield put({type: actions.DELETE_STATEMENT_FAILURE, payload: failureAction.payload, meta})
    }
  } catch (error) {
    logError(error)
    yield put({type: actions.DELETE_STATEMENT_FAILURE, payload: error, meta})
  }
}

function* onDeleteStatementSuccess(action) {
  const routerLocation = yield select(getRouterLocation)
  if (routerLocation.pathname === paths.statement(action.meta.deletedEntity)) {
    yield put({type: actions.ADD_TOAST, payload: { text: text(DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE)}})
    yield put(push(paths.home()))
  }
}

function* onFetchStatementJustificationsFailure(action) {
  const routerLocation = yield select(getRouterLocation)
  // Try to determine whether we are on the page for a statement that was not found
  const path = paths.statement({id: action.meta.statementId})
  if (
      action.payload.status === httpStatuses.NOT_FOUND &&
      // startsWith because we don't have a slug
      routerLocation.pathname.startsWith(path)
  ) {
    yield put({type: actions.ADD_TOAST, payload: { text: text(MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE)}})
    yield put(push(paths.home()))
  }
}

function* onDeleteStatementFailure(action) {
  yield put({type: actions.ADD_TOAST, payload: { text: text(DELETE_STATEMENT_FAILURE_TOAST_MESSAGE)}})
}

function* onCallApiFailure(action) {
  if (action.payload.status === httpStatuses.UNAUTHORIZED) {
    const routerLocation = yield select(getRouterLocation)
    yield put({type: actions.LOGIN_REDIRECT, payload: {routerLocation}})
  }
}

function* onLoginRedirect(action) {
  yield put(push(paths.login()))
}

function* onLoginSuccess(action) {
  yield put({type: actions.ADD_TOAST, payload: { text: text(LOGIN_SUCCESS_TOAST_MESSAGE, action.payload.email)}})
  const loginRedirectLocation = yield select(getLoginRedirectLocation)
  if (loginRedirectLocation) {
    yield put(replace(loginRedirectLocation))
  } else {
    yield put(push(paths.home()))
  }
}

function* onCreateStatementSuccess(action) {
  if (action.payload.isExtant) {
    yield put({type: actions.ADD_TOAST, payload: { text: text(CREATE_EXTANT_STATEMENT_TOAST_MESSAGE)}})
  }
  const statement = action.payload.entities.statements[action.payload.result.statement]
  yield put(push(paths.statement(statement)))
}

function* onCreateStatementJustificationSuccess(action) {
  if (action.payload.isExtant) {
    yield put({type: actions.ADD_TOAST, payload: { text: text(CREATE_EXTANT_STATEMENT_TOAST_MESSAGE)}})
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
  yield put(actions.fetchStatementsSearch(action.payload.mainSearchText))
}

function* onDoEditStatement(action) {
  yield put(push(paths.editStatement(action.payload.statementId)))
}

function* onInitializeMainSearch(action) {
  yield put(actions.mainSearchTextChange(action.payload.searchText))
  yield put(actions.fetchStatementsSearch(action.payload.searchText))
}

function* watchApiCallActions() {
  yield takeEvery([
    actions.FETCH_STATEMENTS,
    actions.UPDATE_CITATION_REFERENCE,
  ], callApiForResource)
}

function* recordRehydrate() {
  isRehydrated = true
}

function* watchVotes() {
  yield takeEvery([
      actions.VERIFY_JUSTIFICATION,
      actions.UN_VERIFY_JUSTIFICATION,
      actions.DISVERIFY_JUSTIFICATION,
      actions.UN_DISVERIFY_JUSTIFICATION,
  ], callApiForVote)
}

function* onViewStatement(action) {
  const {statement} = action.payload
  yield put(push(paths.statement(statement)))
}

function* onUpdateStatementSuccess(action) {
  if (action.meta && action.meta.onSuccess) {
    const {statement} = denormalize(action.payload.result, {statement: statementSchema}, action.payload.entities)
    // TODO anti-pattern of passing callback to action?
    action.meta.onSuccess(statement)
  }
}

function* onFetchResourceSuccess(action) {
  if (action.meta.onSuccess) {
    const entity = denormalize(action.payload.result, action.meta.schema, action.payload.entities)
    action.meta.onSuccess(entity)
  }
}

function* watchFetchStatementJustifications() {
  yield takeEvery(actions.FETCH_STATEMENT_JUSTIFICATIONS, callApiForFetchStatementJustifications)
}

function* watchLogin() {
  yield takeEvery(actions.LOGIN, callApiForLogin)
}

function* watchLoginSuccess() {
  yield takeEvery(actions.LOGIN_SUCCESS, onLoginSuccess)
}

function* watchCreateStatementSuccess() {
  yield takeEvery(actions.CREATE_STATEMENT_SUCCESS, onCreateStatementSuccess)
}

function* watchCreateStatementJustificationSuccess() {
  yield takeEvery(actions.CREATE_STATEMENT_JUSTIFICATION_SUCCESS, onCreateStatementJustificationSuccess)
}

function* watchLogout() {
  yield takeEvery(actions.LOGOUT, callApiForLogout)
}

function* watchCallApi() {
  yield takeEvery(actions.CALL_API, callApi)
}

function* watchCallApiFailure() {
  yield takeEvery(actions.CALL_API_FAILURE, onCallApiFailure)
}

function* watchLoginRedirect() {
  yield takeEvery(actions.LOGIN_REDIRECT, onLoginRedirect)
}

function* watchCreateStatement() {
  yield takeEvery(actions.CREATE_STATEMENT, onCreateStatement)
}

function* watchCreateStatementJustification() {
  yield takeEvery(actions.CREATE_STATEMENT_JUSTIFICATION, onCreateStatementJustification)
}

function* watchDeleteStatement() {
  yield takeEvery(actions.DELETE_STATEMENT, onDeleteStatement)
}

function* watchDeleteStatementSuccess() {
  yield takeEvery(actions.DELETE_STATEMENT_SUCCESS, onDeleteStatementSuccess)
}

function* watchDeleteStatementFailure() {
  yield takeEvery(actions.DELETE_STATEMENT_FAILURE, onDeleteStatementFailure)
}

function* watchFetchStatementJustificationsFailure() {
  yield takeEvery(actions.FETCH_STATEMENT_JUSTIFICATIONS_FAILURE, onFetchStatementJustificationsFailure)
}

function* watchCreateJustification() {
  yield takeEvery(actions.CREATE_JUSTIFICATION, onCreateJustification)
}

function* watchCreateJustificationSuccess() {
  yield takeEvery(actions.CREATE_JUSTIFICATION_SUCCESS, onCreateJustificationSuccess)
}

function* watchCreateJustificationFailure() {
  yield takeEvery(actions.CREATE_JUSTIFICATION_FAILURE, onCreateJustificationFailure)
}

function* watchDeleteJustificationFailure() {
  yield takeEvery(actions.DELETE_JUSTIFICATION_FAILURE, onDeleteJustificationFailure)
}

function* watchDeleteJustification() {
  yield takeEvery(actions.DELETE_JUSTIFICATION, onDeleteJustification)
}

function* watchRehydrate() {
  yield takeEvery(REHYDRATE, recordRehydrate)
}

function* watchDoMainSearch() {
  yield takeEvery(actions.DO_MAIN_SEARCH, onDoMainSearch)
}

function* watchFetchStatementsSearch() {
  yield takeEvery(actions.FETCH_STATEMENTS_SEARCH, callApiForFetchStatementsSearch)
}

function* watchInitializeMainSearch() {
  yield takeEvery(actions.INITIALIZE_MAIN_SEARCH, onInitializeMainSearch)
}

function* watchFetchMainSearchAutocomplete() {
  yield takeEvery(actions.FETCH_MAIN_SEARCH_AUTOCOMPLETE, callApiForFetchMainSearchAutocomplete)
}

function* watchViewStatement() {
  yield takeEvery(actions.VIEW_STATEMENT, onViewStatement)
}

function* watchFetchStatementSuggestions() {
  yield takeEvery(actions.FETCH_STATEMENT_SUGGESTIONS, callApiForFetchStatementSuggestions)
}

function* watchFetchStatementForEdit() {
  yield takeEvery(actions.FETCH_STATEMENT_FOR_EDIT, callApiForFetchStatementForEdit)
}

function* watchDoEditStatement() {
  yield takeEvery(actions.DO_EDIT_STATEMENT, onDoEditStatement)
}

function* watchUpdateStatement() {
  yield takeEvery(actions.UPDATE_STATEMENT, onUpdateStatement)
}

function* watchUpdateStatementSuccess() {
  yield takeEvery(actions.UPDATE_STATEMENT_SUCCESS, onUpdateStatementSuccess)
}

export default () => [
  watchLogin(),
  watchLoginSuccess(),
  watchLogout(),
  watchLoginRedirect(),

  watchApiCallActions(),
  watchFetchStatementJustifications(),
  watchFetchStatementJustificationsFailure(),

  watchCallApi(),
  watchCallApiFailure(),

  watchVotes(),

  watchRehydrate(),

  watchCreateStatement(),
  watchCreateStatementSuccess(),
  watchDeleteStatement(),
  watchDeleteStatementSuccess(),
  watchDeleteStatementFailure(),

  watchUpdateStatement(),
  watchUpdateStatementSuccess(),

  watchCreateStatementJustification(),
  watchCreateStatementJustificationSuccess(),

  watchCreateJustification(),
  watchCreateJustificationSuccess(),
  watchCreateJustificationFailure(),
  watchDeleteJustification(),
  watchDeleteJustificationFailure(),

  watchDoMainSearch(),
  watchDoEditStatement(),
  watchViewStatement(),

  watchFetchStatementsSearch(),
  watchInitializeMainSearch(),
  watchFetchMainSearchAutocomplete(),
  watchFetchStatementSuggestions(),
  watchFetchStatementForEdit(),
]