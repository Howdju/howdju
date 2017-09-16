import {
  delay
} from 'redux-saga'
import {
  take,
  put,
  call,
  fork,
  join,
  takeEvery,
  select,
  race,
  cancel,
  cancelled,
} from 'redux-saga/effects'
import {REHYDRATE} from 'redux-persist/constants'
import {push, replace, LOCATION_CHANGE} from 'react-router-redux'
import cloneDeep from 'lodash/cloneDeep'
import find from 'lodash/find'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import keys from 'lodash/keys'
import map from 'lodash/map'
import pick from 'lodash/pick'
import isEmpty from 'lodash/isEmpty'
import queryString from 'query-string'
import {denormalize} from "normalizr"

import apiErrorCodes from "howdju-common/lib/codes/apiErrorCodes"

import t, {
  A_NETWORK_ERROR_OCCURRED,
  AN_UNEXPECTED_ERROR_OCCURRED,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
  THAT_JUSTIFICATION_ALREADY_EXISTS,
  THAT_STATEMENT_ALREADY_EXISTS,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  YOU_ARE_LOGGED_IN_AS,
  YOU_HAVE_BEEN_LOGGED_OUT,
  DELETE_STATEMENT_FAILURE_TOAST_MESSAGE,
} from '../texts'
import {request} from "../api"
import {
  statementJustificationsSchema,
  voteSchema,
  statementSchema,
  justificationSchema,
  writQuoteSchema,
  statementsSchema,
  statementCompoundSchema,
  perspectivesSchema,
  writsSchema,
  justificationsSchema,
  writQuotesSchema,
} from '../schemas'
import paths from "../paths"
import mainSearcher from '../mainSearcher'
import * as httpMethods from '../httpMethods'
import * as httpStatusCodes from '../httpStatusCodes'
import {
  selectAuthToken,
  selectEditorState,
  selectLoggedErrors,
  selectLoginRedirectLocation,
  selectRouterLocation, selectUser,
  selectUserExternalIds,
} from "../selectors"
import {EditorTypes} from "../reducers/editors"
import {
  api,
  editors,
  goto,
  ui,
  apiActionCreatorsByActionType,
  app,
  flows,
  str,
  errors,
} from "../actions"
import {
  JustificationBasisType,
  JustificationTargetType,
  makeNewStatementCompoundForStatement,
  makeNewStatementJustification,
  removeStatementCompoundId,
  SortDirection,
  JustificationBasisSourceType,
  newImpossibleError,
  newProgrammingError,
  assert,
} from "howdju-common"
import {consolidateBasis} from '../viewModels'
import {logger} from '../logger'
import {
  uiErrorTypes,
  newEditorCommitResultError,
} from "../uiErrors"
import config from "../config"
import * as sentry from '../sentry'
import analytics from "../analytics"

import handleTransientInteractions from './transients'
import * as smallchat from "../smallchat"
import {pageLoadId, getSessionStorageId} from "../identifiers"
import * as customHeaderKeys from "../customHeaderKeys"


// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false


// These methods translate FETCH_* payloads into API calls
export const resourceApiConfigs = {
  [api.fetchStatements]: {
    endpoint: 'statements',
    schema: {statements: statementsSchema},
  },
  [api.fetchRecentStatements]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    queryStringParams.sortProperty = 'created'
    queryStringParams.sortDirection = SortDirection.DESCENDING
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'statements?' + queryStringParamsString,
      schema: {statements: statementsSchema},
    }
  },
  [api.fetchRecentWrits]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    queryStringParams.sortProperty = 'created'
    queryStringParams.sortDirection = SortDirection.DESCENDING
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'writs?' + queryStringParamsString,
      schema: {writs: writsSchema},
    }
  },
  [api.fetchRecentWritQuotes]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    queryStringParams.sortProperty = 'created'
    queryStringParams.sortDirection = SortDirection.DESCENDING
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'writ-quotes?' + queryStringParamsString,
      schema: {writQuotes: writQuotesSchema},
    }
  },
  [api.fetchRecentJustifications]: payload => {
    const queryStringParams = pick(payload, ['continuationToken', 'count'])
    queryStringParams.sortProperty = 'created'
    queryStringParams.sortDirection = SortDirection.DESCENDING
    const queryStringParamsString = queryString.stringify(queryStringParams)
    return {
      endpoint: 'justifications?' + queryStringParamsString,
      schema: {justifications: justificationsSchema},
    }
  },
  [api.fetchJustificationsSearch]: payload => {
    return {
      endpoint: 'justifications?' + queryString.stringify(payload),
      schema: {justifications: justificationsSchema},
    }
  },
  [api.fetchFeaturedPerspectives]: payload => ({
    endpoint: 'perspectives?featured',
    schema: {perspectives: perspectivesSchema},
    requiresRehydrate: true,
  }),
  [api.fetchStatement]: payload => ({
    endpoint: `statements/${payload.statementId}`,
    schema: {statement: statementSchema},
  }),
  [api.fetchStatementCompound]: payload => ({
    endpoint: `statement-compounds/${payload.statementCompoundId}`,
    schema: {statementCompound: statementCompoundSchema},
  }),
  [api.fetchWritQuote]: payload => ({
    endpoint: `writ-quotes/${payload.writQuoteId}`,
    schema: {writQuote: writQuoteSchema},
  }),
  [api.updateWritQuote]: payload => ({
    endpoint: `writ-quotes/${payload.writQuote.id}`,
    fetchInit: {
      method: httpMethods.PUT,
      body: payload
    },
    schema: {writQuote: writQuoteSchema},
  }),
  [api.createStatement]: payload => ({
    endpoint: 'statements',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {statement: statementSchema}
  }),
  [api.updateStatement]: payload => ({
    endpoint: `statements/${payload.statement.id}`,
    schema: {statement: statementSchema},
    fetchInit: {
      method: httpMethods.PUT,
      body: {
        statement: payload.statement
      }
    },
  }),
  [api.createJustification]: payload => ({
    endpoint: 'justifications',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {justification: justificationSchema}
  }),
  [api.deleteStatement]: payload => ({
    endpoint: `statements/${payload.statement.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.deleteJustification]: payload => ({
    endpoint: `justifications/${payload.justification.id}`,
    fetchInit: {
      method: httpMethods.DELETE,
    },
  }),
  [api.login]: payload => ({
    endpoint: 'login',
    fetchInit: {
      method: httpMethods.POST,
      body: payload,
    }
  }),
  [api.logout]: {
    endpoint: 'logout',
    fetchInit: {
      method: httpMethods.POST,
    }
  },
  [api.fetchStatementJustifications]: payload => ({
    endpoint: `statements/${payload.statementId}?include=justifications`,
    fetchInit: {
      method: httpMethods.GET,
    },
    schema: statementJustificationsSchema,
    requiresRehydrate: true
  }),
  [api.fetchStatementsSearch]: payload => ({
    endpoint: `search-statements?searchText=${payload.searchText}`,
    schema: statementsSchema,
  }),
  [api.verifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.unVerifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.disverifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.POST,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.unDisverifyJustification]: payload => ({
    endpoint: 'votes',
    fetchInit: {
      method: httpMethods.DELETE,
      body: {
        vote: payload.vote
      }
    },
    schema: {vote: voteSchema},
  }),
  [api.fetchStatementTextSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.statementText}`,
    cancelKey: str(api.fetchStatementTextSuggestions) + '.' + payload.suggestionsKey,
    schema: statementsSchema,
  }),
  [api.fetchWritTitleSuggestions]: payload => ({
    endpoint: `search-writs?searchText=${payload.writTitle}`,
    cancelKey: str(api.fetchWritTitleSuggestions) + '.' + payload.suggestionsKey,
    schema: writsSchema,
  }),
  [api.fetchMainSearchSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.searchText}`,
    cancelKey: str(api.fetchMainSearchSuggestions) + '.' + payload.suggestionsKey,
    schema: statementsSchema,
  })
}

function* constructHeaders(fetchInit) {
  const headersUpdate = {}
  // Add auth token to all API requests
  const authToken = yield select(selectAuthToken)
  if (authToken) {
    headersUpdate.Authorization = `Bearer ${authToken}`
  }
  const sessionStorageId = getSessionStorageId()
  if (sessionStorageId) {
    headersUpdate[customHeaderKeys.SESSION_STORAGE_ID] = sessionStorageId
  }
  if (pageLoadId) {
    headersUpdate[customHeaderKeys.PAGE_LOAD_ID] = pageLoadId
  }

  return isEmpty(headersUpdate) ?
    fetchInit.headers :
    {...fetchInit.headers, ...headersUpdate}
}

function* tryWaitOnRehydrate(requiresRehydrate) {
  if (requiresRehydrate && !isRehydrated) {
    logger.debug('Waiting on rehydrate')
    const {rehydrate, timeout} = yield race({
      rehydrate: take(REHYDRATE),
      timeout: delay(config.rehydrateTimeoutMs),
    })
    if (rehydrate) {
      logger.debug('Proceeding after rehydrate')
    } else if (timeout) {
      logger.warn('Rehydrate timed out')
    } else {
      logger.error('Unknown rehydrate race condition')
    }
  }
}

function* callApi(endpoint, schema, fetchInit = {}, requiresRehydrate = false) {

  try {
    yield* tryWaitOnRehydrate(requiresRehydrate)

    fetchInit = cloneDeep(fetchInit)
    fetchInit.headers = yield* constructHeaders(fetchInit)

    const result = yield call(request, {endpoint, method: fetchInit.method, body: fetchInit.body, headers: fetchInit.headers, schema})
    return yield put(api.callApi.response(result))
  } catch (error) {
    return yield put(api.callApi.response(error))
  }
}

const cancelableResourceCallTasks = {}

function* callApiForResource(action) {
  const responseActionCreator = apiActionCreatorsByActionType[action.type].response

  try {
    let config = resourceApiConfigs[action.type]
    if (!config) {
      return yield put(responseActionCreator(newImpossibleError(`Missing resource API config for action type: ${action.type}`)))
    }
    const {endpoint, fetchInit, schema, requiresRehydrate, cancelKey} = isFunction(config) ?
      config(action.payload) :
      config

    if (cancelKey) {
      const prevTask = cancelableResourceCallTasks[cancelKey]
      if (prevTask) {
        yield cancel(prevTask)
      }
    }

    const task = yield fork(callApi, endpoint, schema, fetchInit, requiresRehydrate)

    if (cancelKey) {
      cancelableResourceCallTasks[cancelKey] = task
    }

    const apiResultAction = yield join(task)

    if (cancelKey) {
      delete cancelableResourceCallTasks[cancelKey]
    }

    const responseMeta = {
      schema,
      requestPayload: action.payload,
    }
    return yield put(responseActionCreator(apiResultAction.payload, responseMeta))
  } catch (error) {
    return yield put(responseActionCreator(error))
  } finally {
    if (yield cancelled()) {
      logger.debug(`Canceled ${action.type}`)
    }
  }
}

function* goHomeIfDeleteStatementWhileViewing() {
  yield takeEvery(str(api.deleteStatement.response), function* goHomeIfDeleteStatementWhileViewingWorker(action) {
    if (!action.error) {
      const routerLocation = yield select(selectRouterLocation)
      if (routerLocation.pathname === paths.statement(action.meta.requestPayload.statement)) {
        yield put(ui.addToast(t(DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE)))
        yield put(push(paths.home()))
      }
    }
  })
}

function* redirectToLoginWhenUnauthorized() {
  yield takeEvery(str(api.callApi.response), function* redirectToLoginWhenUnauthorizedWorker(action) {
    if (action.error) {
      const {httpStatusCode} = action.payload
      if (httpStatusCode === httpStatusCodes.UNAUTHORIZED) {
        const routerLocation = yield select(selectRouterLocation)
        yield put(goto.login(routerLocation))
      }
    }
  })
}

function* redirectAfterLogin() {
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

function* configureAfterLogin() {
  yield takeEvery(str(api.login.response), function* setSentryUserContextAfterLoginWorker(action) {
    if (!action.error) {
      const externalIds = yield select(selectUserExternalIds)
      const {
        sentryId,
        smallchatId,
      } = externalIds
      if (sentryId) {
        sentry.setUserContext(sentryId)
      }

      const {shortName, longName} = yield select(selectUser)
      if (smallchatId) {
        smallchat.identify(smallchatId, shortName, longName)
      }
      analytics.identify(externalIds)
    }
  })
}

function* resourceApiCalls() {
  const actionTypes = keys(resourceApiConfigs)
  yield takeEvery(actionTypes, callApiForResource)
}

function* goTo() {

  yield takeEvery(str(goto.login), function* goToLoginWorker() {
    yield put(push(paths.login()))
  })

  yield takeEvery(str(goto.mainSearch), function* goToMainSearchWorker(action) {
    const mainSearchPath = paths.mainSearch(action.payload.mainSearchText)
    const routerLocation = yield select(selectRouterLocation)
    const routerMainSearchText = mainSearcher.mainSearchText(routerLocation)
    const urlSearchText = paths.mainSearch(routerMainSearchText)
    if (urlSearchText !== mainSearchPath) {
      yield put(push(mainSearchPath))
    }
    yield put(api.fetchStatementsSearch(action.payload.mainSearchText))
  })

  yield takeEvery(str(goto.statement), function* goToStatementWorker(action) {
    const {statement} = action.payload
    yield put(push(paths.statement(statement)))
  })
}

function* redirectHomeFromMissingStatement() {
  yield takeEvery(str(api.fetchStatementJustifications.response), function* leaveMissingStatementWorker(action) {
    if (action.error) {
      const routerLocation = yield select(selectRouterLocation)
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

function* apiFailureErrorMessages() {
  const messageKeysByActionType = {
    [api.deleteStatement.response]: DELETE_STATEMENT_FAILURE_TOAST_MESSAGE,
    [api.deleteJustification.response]: DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [api.verifyJustification.response]: VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [api.unVerifyJustification.response]: UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [api.disverifyJustification.response]: DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [api.unDisverifyJustification.response]: UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  }

  yield [map(messageKeysByActionType, function* apiFailureErrorMessagesWorker(messageKey, actionType) {
    yield takeEvery(actionType, function* (action) {
      if (action.error) {
        yield put(ui.addToast(t(messageKey)))
      }
    })
  })]
}

function* onRehydrate() {
  yield takeEvery(REHYDRATE, function* flagRehydrateWorker() {
    isRehydrated = true
  })

  yield takeEvery(REHYDRATE, function* setSentryUserContextWorker() {
    const externalIds = yield select(selectUserExternalIds, {})
    const {sentryId} = externalIds
    if (sentryId) {
      sentry.setUserContext(sentryId)
    }
    analytics.identify(externalIds)
  })
}

function* fetchMainSearchResults() {
  yield takeEvery(str(app.fetchMainSearchResults), function* fetchMainSearchResultsWorker(action) {
    yield put(ui.mainSearchTextChange(action.payload.searchText))
    yield put(api.fetchStatementsSearch(action.payload.searchText))
  })
}

function* editorCommitEdit() {

  const CREATE = 'CREATE'
  const UPDATE = 'UPDATE'
  const editorTypeCommitApiResourceActions = {
    [EditorTypes.STATEMENT]: {
      [UPDATE]: api.updateStatement
    },
    [EditorTypes.STATEMENT_JUSTIFICATION]: (model, crudType) => {
      switch (crudType) {
        case CREATE: {
          if (model.doCreateJustification) {
            const justification = consolidateBasis(model.justification)
            justification.target.entity = model.statement
            return api.createJustification(justification)
          } else {
            return api.createStatement(model.statement)
          }
        }
      }
    },
    [EditorTypes.COUNTER_JUSTIFICATION]: {
      [CREATE]: api.createJustification,
    },
    [EditorTypes.NEW_JUSTIFICATION]: (model, crudType) => {
      switch (crudType) {
        case CREATE: {
          const justification = consolidateBasis(model)
          return api.createJustification(justification)
        }
      }
    },
    [EditorTypes.WRIT_QUOTE]: {
      [UPDATE]: api.updateWritQuote
    },
    [EditorTypes.LOGIN_CREDENTIALS]: {
      [CREATE]: api.login,
    },
  }

  const createEditorCommitApiResourceAction = (editorType, editEntity) => {

    const editorCommitApiResourceActions = editorTypeCommitApiResourceActions[editorType]
    if (!editorCommitApiResourceActions) {
      throw new Error(`Missing editor type ${editorType} action creator config.`)
    }

    const crudType = editEntity.id ? UPDATE : CREATE
    let action
    if (isFunction(editorCommitApiResourceActions)) {
      action = editorCommitApiResourceActions(editEntity, crudType)
    } else {
      const actionCreator = editorCommitApiResourceActions[crudType]
      if (!actionCreator) {
        throw new Error(`Missing ${crudType} action creator to commit edit of ${editorType}.`)
      }
      action = actionCreator(editEntity)
    }
    return action
  }

  yield takeEvery(str(editors.commitEdit), function* editorCommitEditWorker(action) {
    const {
      editorType,
      editorId,
    } = action.payload

    if (!editorType) {
      throw newProgrammingError("editorType is required")
    }
    if (!editorId) {
      throw newProgrammingError("editorId is required")
    }

    const {editEntity} = yield select(selectEditorState(editorType, editorId))
    const editorCommitApiResourceAction = createEditorCommitApiResourceAction(editorType, editEntity)
    const meta = {
      editEntity
    }
    try {
      const resultAction = yield call(callApiForResource, editorCommitApiResourceAction)
      if (resultAction.error) {
        return yield put(editors.commitEdit.result(newEditorCommitResultError(editorType, editorId, resultAction.payload), meta))
      } else {
        return yield put(editors.commitEdit.result(editorType, editorId, resultAction.payload, meta))
      }
    } catch (error) {
      return yield put(editors.commitEdit.result(newEditorCommitResultError(editorType, editorId, error), meta))
    }
  })
}

function* commitEditorThenView() {

  const editorCommitResultGotoActionCreators = {
    [EditorTypes.STATEMENT]: (entities, result) => {
      const statement = entities.statements[result.statement]
      return goto.statement(statement)
    },
    [EditorTypes.STATEMENT_JUSTIFICATION]: (entities, result) => {
      let statementId
      if (result.statement) {
        statementId = result.statement
      } else {
        assert(() => !!result.justification)
        const justificationId = result.justification
        const justification = entities.justifications[justificationId]
        switch (justification.target.type) {
          case JustificationTargetType.STATEMENT: {
            statementId = justification.target.entity.id
            break
          }
          default: {
            statementId = justification.rootStatement.id
            break
          }
        }
      }

      const statement = entities.statements[statementId]
      return goto.statement(statement)
    },
  }

  const gotoEditorCommitResultAction = (editorType, resultAction) => {
    const {entities, result} = resultAction.payload.result
    const gotoActionCreator = editorCommitResultGotoActionCreators[editorType]
    const gotoAction = gotoActionCreator(entities, result)
    return gotoAction
  }

  yield takeEvery(str(flows.commitEditThenView), function* commitEditThenViewWorker(action) {
    const {editorType, editorId} = action.payload
    yield put(editors.commitEdit(editorType, editorId))
    let resultAction = null
    while (!resultAction) {
      const currResultAction = yield take(str(editors.commitEdit.result))
      if (currResultAction.payload.editorType === editorType && currResultAction.payload.editorId === editorId) {
        resultAction = currResultAction
      }
    }
    if (!resultAction.error) {
      yield put(gotoEditorCommitResultAction(editorType, resultAction))
    }
  })
}

function* commitEditThenPutActionOnSuccess() {
  yield takeEvery(str(flows.commitEditThenPutActionOnSuccess), function* commitEditThenPutActionOnSuccessWorker(action) {
    const {editorType, editorId} = action.payload
    yield put(editors.commitEdit(editorType, editorId))
    let resultAction = null
    while (!resultAction) {
      const currResultAction = yield take(str(editors.commitEdit.result))
      if (currResultAction.payload.editorType === editorType && currResultAction.payload.editorId === editorId) {
        resultAction = currResultAction
      }
    }
    if (!resultAction.error) {
      yield put(action.payload.onSuccessAction)
    }
  })
}

function* fetchAndBeginEditOfNewJustificationFromBasisSource() {

  const fetchActionCreatorForBasisType = basisType => {
    const actionCreatorByBasisType = {
      [JustificationBasisSourceType.STATEMENT_COMPOUND]: api.fetchStatementCompound,
      [JustificationBasisSourceType.WRIT_QUOTE]: api.fetchWritQuote,
      [JustificationBasisSourceType.STATEMENT]: api.fetchStatement,
    }
    const actionCreator = actionCreatorByBasisType[basisType]
    if (!actionCreator) {
      throw newImpossibleError(`${basisType} exhausted justification basis types`)
    }
    return actionCreator
  }

  const extractBasisFromFetchResponseAction = (basisType, fetchResponseAction) => {
    const {
      result,
      entities
    } = fetchResponseAction.payload
    const {
      schema,
    } = fetchResponseAction.meta

    const basisGetterByBasisType = {
      [JustificationBasisSourceType.STATEMENT_COMPOUND]: result => result.statementCompound,
      [JustificationBasisSourceType.WRIT_QUOTE]: result => result.writQuote,
      [JustificationBasisSourceType.STATEMENT]: result => result.statement,
      [JustificationBasisSourceType.JUSTIFICATION_BASIS_COMPOUND]: result => result.justificationBasisCompound,
    }

    const basisGetter = basisGetterByBasisType[basisType]
    if (!basisGetter) {
      throw newImpossibleError(`${basisType} exhausted justification basis types`)
    }
    const basis = basisGetter(denormalize(result, schema, entities))

    return basis
  }

  yield takeEvery(str(flows.fetchAndBeginEditOfNewJustificationFromBasisSource), function* fetchAndBeginEditOfNewJustificationFromBasisSourceWorker(action) {
    const {
      editorId,
      editorType,
      basisSourceType,
      basisId,
    } = action.payload
    const actionCreator = fetchActionCreatorForBasisType(basisSourceType)
    const fetchResponseAction = yield call(callApiForResource, actionCreator(basisId))
    if (!fetchResponseAction.error) {
      const basis = extractBasisFromFetchResponseAction(basisSourceType, fetchResponseAction)

      let basisType = basisSourceType

      let statementCompound = undefined
      if (basisSourceType === JustificationBasisType.STATEMENT_COMPOUND) {
        statementCompound = basis
        removeStatementCompoundId(statementCompound)
      } else if (basisSourceType === JustificationBasisSourceType.STATEMENT) {
        basisType = JustificationBasisType.STATEMENT_COMPOUND
        statementCompound = makeNewStatementCompoundForStatement(basis)
      }

      let writQuote = undefined
      if (basisType === JustificationBasisType.WRIT_QUOTE) {
        writQuote = basis
      }

      let justificationBasisCompound = undefined
      if (basisType === JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND) {
        justificationBasisCompound = basis
      }

      const editModel = makeNewStatementJustification({}, {
        basis: {
          type: basisType,
          statementCompound,
          writQuote,
          justificationBasisCompound,
        }
      })
      yield put(editors.beginEdit(editorType, editorId, editModel))
    }
  })
}

function* showAlertForUnexpectedApiError() {
  yield takeEvery(str(api.callApi.response), function* showAlertForUnexpectedApiErrorWorker(action) {
    if (action.error) {
      if (action.payload.errorType) {
        switch (action.payload.errorType) {
          case uiErrorTypes.NETWORK_FAILURE_ERROR: {
            yield put(ui.addToast(t(A_NETWORK_ERROR_OCCURRED)))
            break
          }
          case uiErrorTypes.API_RESPONSE_ERROR: {
            const errorCode = get(action.payload, ['body', 'errorCode'])
            if (!errorCode) {
              logger.error('API response error missing error code')
              yield put(ui.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
            } else if (errorCode === apiErrorCodes.UNEXPECTED_ERROR) {
              yield put(ui.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
            }
            break
          }
          default: {
            logger.error(`Unexpected error type: ${action.payload}`)
            logger.error(action.payload)
            yield put(ui.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
            break
          }
        }
      } else {
        logger.error(`${str(api.callApi.response)} missing errorType`)
        logger.error(`Unexpected error type: ${action.payload}`)
        logger.error(action.payload)
        yield put(ui.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
      }
    }
  })
}

function* showAlertForExtantEntities() {

  const toastMessageKeys = {
    [api.createStatement.response]: THAT_STATEMENT_ALREADY_EXISTS,
    [api.createJustification.response]: THAT_JUSTIFICATION_ALREADY_EXISTS,
  }

  yield takeEvery([
    str(api.createStatement.response),
    str(api.createJustification.response)
  ], function* showAlertForExtantEntitiesWorker(action) {
    if (!action.error) {
      if (action.payload.result.isExtant) {
        const toastMessageKey = toastMessageKeys[action.type]
        yield put(ui.addToast(t(toastMessageKey)))
      }
    }
  })
}

function* showAlertForLogin() {
  yield takeEvery(str(api.login.response), function* showAlertForLoginWorker(action) {
    if (!action.error) {
      yield put(ui.addToast(t(YOU_ARE_LOGGED_IN_AS, action.payload.user.email)))
    }
  })
}

function* showAlertForLogout() {
  yield takeEvery(str(api.logout.response), function* showAlertForLogoutWorker(action) {
    if (!action.error) {
      yield put(ui.addToast(t(YOU_HAVE_BEEN_LOGGED_OUT)))
    }
  })
}

function* logErrors() {

  yield takeEvery('*', function* logErrorsWorker(action) {
    if (action.error) {
      const error = action.payload
      const loggedErrors = yield select(selectLoggedErrors)
      // Sometimes we wrap the same exception in multiple actions, such as callApi.response and then fetchStatements.response
      // So don't log the same error multiple times
      if (!find(loggedErrors, e => e === error)) {
        loggedErrors.push(error)
        const identifierKeys = pick(error, customHeaderKeys.identifierKeys)
        const options = isEmpty(identifierKeys) ? undefined : {extra: identifierKeys}
        logger.exception(error, options)
      }
    }
  })

  yield takeEvery(str(errors.clearLoggedErrors), function* clearLoggedErrorsWorker(action) {
    // Periodically clear the logged errors since the find above is linear
    yield call(delay, 10000)
    yield put(errors.clearLoggedErrors())
  })
}

function* onLocationChange() {
  yield takeEvery(LOCATION_CHANGE, function* locationChangeWorker(action) {
    const location = action.payload
    analytics.sendPageView(location.pathname)
  })
}

export default () => [
  onRehydrate(),
  fetchMainSearchResults(),
  logErrors(),

  resourceApiCalls(),

  goTo(),
  redirectToLoginWhenUnauthorized(),
  configureAfterLogin(),
  redirectAfterLogin(),

  goHomeIfDeleteStatementWhileViewing(),
  redirectHomeFromMissingStatement(),
  apiFailureErrorMessages(),
  editorCommitEdit(),
  commitEditorThenView(),
  commitEditThenPutActionOnSuccess(),
  fetchAndBeginEditOfNewJustificationFromBasisSource(),

  showAlertForUnexpectedApiError(),
  showAlertForExtantEntities(),
  showAlertForLogin(),
  showAlertForLogout(),

  handleTransientInteractions(),

  onLocationChange(),
]