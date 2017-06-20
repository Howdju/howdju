import {
  delay
} from 'redux-saga'
import {
  put,
  call,
  take,
  takeEvery,
  select,
  race,
} from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import {REHYDRATE} from 'redux-persist/constants'
import {push, replace} from 'react-router-redux'
import map from 'lodash/map'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import keys from 'lodash/keys'

import text, {
  A_NETWORK_ERROR_OCCURRED,
  AN_UNEXPECTED_ERROR_OCCURRED,
  default as t,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE, THAT_JUSTIFICATION_ALREADY_EXISTS, THAT_STATEMENT_ALREADY_EXISTS,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE, YOU_HAVE_BEEN_LOGGED_OUT,
} from './texts'
import {request} from "./api";
import {
  statementJustificationsSchema,
  voteSchema,
  statementSchema,
  justificationSchema,
  citationReferenceSchema, statementsSchema
} from './schemas'
import paths from "./paths";
import {DELETE_STATEMENT_FAILURE_TOAST_MESSAGE} from "./texts";
import mainSearcher from './mainSearcher'
import * as httpMethods from './httpMethods'
import * as httpStatusCodes from './httpStatusCodes'
import {denormalize} from "normalizr";
import {
  selectAuthToken,
  selectEditorState,
  selectLoginRedirectLocation,
  selectRouterLocation
} from "./selectors";
import {EditorTypes} from "./reducers/editors";
import {
  api,
  editors,
  goto,
  ui,
  apiActionCreatorsByActionType,
  app,
  flows, str,
} from "./actions";
import {
  consolidateBasis,
  JustificationBasisType, JustificationTargetType,
  makeNewStatementJustification
} from "./models";
import {logger} from './util'
import apiErrorCodes from "./apiErrorCodes";
import {customErrorTypes, newEditorCommitResultError, newImpossibleError} from "./customErrors";
import {assert} from './util'
import config from "./config";

// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false


// These methods translate FETCH_* payloads into API calls
export const resourceApiConfigs = {
  [api.fetchStatements]: {
    endpoint: 'statements',
    schema: {statements: statementsSchema},
  },
  [api.fetchStatement]: payload => ({
    endpoint: `statements/${payload.statementId}`,
    schema: {statement: statementSchema},
  }),
  [api.fetchCitationReference]: payload => ({
    endpoint: `citation-references/${payload.citationReferenceId}`,
    schema: {citationReference: citationReferenceSchema},
  }),
  [api.updateCitationReference]: payload => ({
    endpoint: `citation-references/${payload.citationReference.id}`,
    fetchInit: {
      method: httpMethods.PUT,
      body: payload
    },
    schema: {citationReference: citationReferenceSchema},
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
  [api.fetchMainSearchSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.searchText}`,
  }),
  [api.fetchCitationTextSuggestions]: payload => ({
    endpoint: `search-citations?searchText=${payload.citationText}`,
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
  }),
}

function* callApi(endpoint, schema, fetchInit = {}, requiresRehydrate = false) {
  try {
    if (requiresRehydrate && !isRehydrated) {
      logger.debug('Waiting on rehydrate')
      const {rehydrate, timeout} = yield race({
          rehydrate: take(REHYDRATE),
          timeout: delay(config.rehydrateTimeoutMs),
      })
      if (rehydrate) {
        logger.debug('Proceeding after rehydrate')
      } else {
        logger.debug('Rehydrate timed out')
      }
    }

    fetchInit = cloneDeep(fetchInit)

    // Add auth token to all API requests
    const authToken = yield select(selectAuthToken)
    if (authToken) {
      fetchInit.headers = merge({}, fetchInit.headers, {
        Authorization: `Bearer ${authToken}`,
      })
    }

    const result = yield call(request, {endpoint, method: fetchInit.method, body: fetchInit.body, headers: fetchInit.headers, schema})
    return yield put(api.callApi.response(result))
  } catch (error) {
    return yield put(api.callApi.response(error))
  }
}

function* callApiForResource(action) {
  const responseActionCreator = apiActionCreatorsByActionType[action.type].response

  try {
    let config = resourceApiConfigs[action.type]
    const {endpoint, fetchInit, schema, requiresRehydrate} = isFunction(config) ?
        config(action.payload) :
        config

    const apiResultAction = yield call(callApi, endpoint, schema, fetchInit, requiresRehydrate)

    const responseMeta = {
      schema,
      requestPayload: action.payload,
    }
    return yield put(responseActionCreator(apiResultAction.payload, responseMeta))
  } catch (error) {
    return yield put(responseActionCreator(error))
  }
}

function* goHomeIfDeleteStatementWhileViewing() {
  yield takeEvery(str(api.deleteStatement.response), function* goHomeIfDeleteStatementWhileViewingWorker(action) {
    if (!action.error) {
      const routerLocation = yield select(selectRouterLocation)
      if (routerLocation.pathname === paths.statement(action.meta.requestPayload.statement)) {
        yield put(ui.addToast(text(DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE)))
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

function* resourceApiCalls() {
  const actionTypes = keys(resourceApiConfigs)
  yield takeEvery(actionTypes, callApiForResource)
}

function* goTo() {

  yield takeEvery(str(goto.login), function* goToLoginWorker() {
    yield put(push(paths.login()))
  })

  yield takeEvery(str(goto.createJustification), function* goToCreateJustificationWorker(action) {
    const {
      basisType,
      basisId,
    } = action.payload
    yield put(push(paths.createJustification(basisType, basisId)))
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
        yield put(ui.addToast(text(MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE)))
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
        yield put(ui.addToast(text(messageKey)))
      }
    })
  })]
}

function* flagRehydrate() {
  yield takeEvery(REHYDRATE, function* flagRehydrateWorker() {
    isRehydrated = true
  })
}

function* goToMainSearch() {
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
}

function* initializeMainSearch() {
  yield takeEvery(str(app.initializeMainSearch), function* initializeMainSearchWorker(action) {
    yield put(ui.mainSearchTextChange(action.payload.searchText))
    yield put(api.fetchStatementsSearch(action.payload.searchText))
  })
}

function* goToStatement() {
  yield takeEvery(str(goto.statement), function* goToStatementWorker(action) {
    const {statement} = action.payload
    yield put(push(paths.statement(statement)))
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
            return api.createJustification.bind(null, justification)
          } else {
            return api.createStatement.bind(null, model.statement)
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
          return api.createJustification.bind(null, justification)
        }
      }
    },
    [EditorTypes.CITATION_REFERENCE]: {
      [UPDATE]: api.updateCitationReference
    },
  }

  const createEditorCommitApiResourceAction = (editorType, editEntity) => {
    const crudType = editEntity.id ? UPDATE : CREATE
    const editorCommitApiResourceActions = editorTypeCommitApiResourceActions[editorType]
    const actionCreator = isFunction(editorCommitApiResourceActions) ?
        editorCommitApiResourceActions(editEntity, crudType) :
        editorCommitApiResourceActions[crudType]
    if (!actionCreator) {
      throw new Error(`Missing ${crudType} action creator to commit edit of ${editorType}.`)
    }
    return actionCreator(editEntity)
  }

  yield takeEvery(str(editors.commitEdit), function* editorCommitEditWorker(action) {
    const {
      editorType,
      editorId,
    } = action.payload

    if (!editorType) {
      throw new Error("editorType is required")
    }
    if (!editorId) {
      throw new Error("editorId is required")
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
      logger.error(error)
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
            statementId = justification.rootStatementId
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
    }
  )
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

function* fetchAndBeginEditOfNewJustificationFromBasis() {

  const fetchActionCreatorForBasisType = basisType => {
    const actionCreatorByBasisType = {
      [JustificationBasisType.STATEMENT]: api.fetchStatement,
      [JustificationBasisType.CITATION_REFERENCE]: api.fetchCitationReference,
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
      [JustificationBasisType.STATEMENT]: result => result.statement,
      [JustificationBasisType.CITATION_REFERENCE]: result => result.citationReference,
    }

    const basisGetter = basisGetterByBasisType[basisType]
    if (!basisGetter) {
      throw newImpossibleError(`${basisType} exhausted justification basis types`)
    }
    const basis = basisGetter(denormalize(result, schema, entities))

    return basis
  }

  yield takeEvery(str(flows.fetchAndBeginEditOfNewJustificationFromBasis), function* fetchAndBeginEditOfNewJustificationFromBasisWorker(action) {
    const {
      editorId,
      editorType,
      basisType,
      basisId,
    } = action.payload
    const actionCreator = fetchActionCreatorForBasisType(basisType)
    const fetchResponseAction = yield call(callApiForResource, actionCreator(basisId))
    if (!fetchResponseAction.error) {
      const basis = extractBasisFromFetchResponseAction(basisType, fetchResponseAction)
      const statement = basisType === JustificationBasisType.STATEMENT ? basis : undefined
      const citationReference = basisType === JustificationBasisType.CITATION_REFERENCE ? basis : undefined
      const editModel = makeNewStatementJustification({}, {
        basis: {
          type: basisType,
          statement: statement,
          citationReference: citationReference,
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
          case customErrorTypes.NETWORK_FAILURE_ERROR: {
            yield put(ui.addToast(t(A_NETWORK_ERROR_OCCURRED)))
            break
          }
          case customErrorTypes.API_RESPONSE_ERROR: {
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
        yield put(ui.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
        logger.error(`Unexpected error type: ${action.payload}`)
        logger.error(action.payload)
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

function* showAlertForLogout() {
  yield takeEvery(str(api.logout.response), function* showAlertForLogoutWorker(action) {
    if (!action.error) {
      yield put(ui.addToast(t(YOU_HAVE_BEEN_LOGGED_OUT)))
    }
  })
}

export default () => [
  flagRehydrate(),
  initializeMainSearch(),

  resourceApiCalls(),

  redirectToLoginWhenUnauthorized(),
  goTo(),
  redirectAfterLogin(),

  goToStatement(),
  goHomeIfDeleteStatementWhileViewing(),
  redirectHomeFromMissingStatement(),
  apiFailureErrorMessages(),
  editorCommitEdit(),
  goToMainSearch(),
  commitEditorThenView(),
  commitEditThenPutActionOnSuccess(),
  fetchAndBeginEditOfNewJustificationFromBasis(),

  showAlertForUnexpectedApiError(),
  showAlertForExtantEntities(),
  showAlertForLogout(),
]