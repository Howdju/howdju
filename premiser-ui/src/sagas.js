import { put, call, take, takeEvery, select, race } from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import {REHYDRATE} from 'redux-persist/constants'
import {push, replace} from 'react-router-redux'
import map from 'lodash/map'
import get from 'lodash/get'

import text, {
  A_NETWORK_ERROR_OCCURRED,
  AN_UNEXPECTED_ERROR_OCCURRED,
  default as t,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_STATEMENT_SUCCESS_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  MISSING_STATEMENT_REDIRECT_TOAST_MESSAGE,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
} from './texts'
import {fetchJson} from "./api";
import {logError} from './util'
import {
  statementJustificationsSchema,
  voteSchema,
  statementSchema,
  justificationSchema,
  citationReferenceSchema, statementJustificationSchema, statementsSchema
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
  JustificationBasisType,
  makeNewStatementJustification
} from "./models";
import {logger} from './util'
import apiErrorCodes from "./apiErrorCodes";
import {customErrorTypes} from "./customErrors";

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
  [api.createStatementJustification]: payload => ({
    endpoint: 'statement-justifications',
    fetchInit: {
      method: httpMethods.POST,
      body: payload
    },
    schema: {statementJustification: statementJustificationSchema}
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
  [api.fetchStatementTextSuggestions]: payload => ({
    endpoint: `search-statements?searchText=${payload.statementText}`,
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
}

function* callApi(endpoint, schema, fetchInit = {}, requiresRehydrate = false) {
  try {
    if (requiresRehydrate && !isRehydrated) {
      logger.debug('Waiting on rehydrate')
      yield take(REHYDRATE)
      logger.debug('Proceeding after rehydrate')
    }

    let fetchInitUpdate = {}

    // Add auth token to all API requests
    const authToken = yield select(selectAuthToken)
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
  const actionTypes = map(api, str)
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
  const EditorTypeCommitActionCreators = {
    [EditorTypes.STATEMENT]: {
      [UPDATE]: api.updateStatement
    },
    [EditorTypes.JUSTIFICATION]: {
      [CREATE]: api.createJustification,
    }
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
    const actionCreatorCrudType = editEntity.id ? UPDATE : CREATE
    const actionCreator = EditorTypeCommitActionCreators[editorType][actionCreatorCrudType]

    if (!actionCreator) {
      throw new Error(`Missing EditorTypeCommitActionCreators for ${editorType}.${actionCreatorCrudType}`)
    }

    try {
      const resultAction = yield call(callApiForResource, actionCreator(editEntity))
      return yield put(editors.commitEdit.result(editorType, editorId, resultAction.payload))
    } catch (error) {
      logError(error)
      return yield put(editors.commitEdit.result(editorType, editorId, error))
    }
  })
}

function* createEntityThenView() {

  yield takeEvery(str(flows.createStatementThenView), function* createStatementThenViewWorker(action) {
    const createResponseAction = yield call(callApiForResource, api.createStatement(...action.payload.args))
    if (!createResponseAction.error) {
      const {entities, result} = createResponseAction.payload
      const statement = entities.statements[result.statement]
      yield put(goto.statement(statement))
    }
  })

  yield takeEvery(str(flows.createStatementJustificationThenView), function* createStatementJustificationThenViewWorker(action) {
    const createResponseAction = yield call(callApiForResource, api.createStatementJustification(...action.payload.args))
    if (!createResponseAction.error) {
      const {entities, result} = createResponseAction.payload
      const statement = entities.statements[result.statementJustification.statement]
      yield put(goto.statement(statement))
    }
  })

}

function* fetchAndBeginEditOfNewJustificationFromBasis() {

  const actionCreatorByBasisType = {
    [JustificationBasisType.STATEMENT]: api.fetchStatement,
    [JustificationBasisType.CITATION_REFERENCE]: api.fetchCitationReference,
  }
  // TODO for endpoints returning one entity, could just get only key of result and denormalize it
  const basisGetterByBasisType = {
    [JustificationBasisType.STATEMENT]: result => result.statement,
    [JustificationBasisType.CITATION_REFERENCE]: result => result.citationReference,
  }

  yield takeEvery(str(flows.fetchAndBeginEditOfNewJustificationFromBasis), function* fetchAndBeginEditOfNewJustificationFromBasisWorker(action) {
    const {
      editorId,
      editorType,
      basisType,
      basisId,
    } = action.payload
    const actionCreator = actionCreatorByBasisType[basisType]
    const fetchResponseAction = yield call(callApiForResource, actionCreator(basisId))
    if (!fetchResponseAction.error) {
      const {
        result,
        entities
      } = fetchResponseAction.payload
      const {
        schema,
      } = fetchResponseAction.meta
      const basisGetter = basisGetterByBasisType[basisType]
      const basis = basisGetter(denormalize(result, schema, entities))
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

function* createJustificationThenPutActionIfSuccessful() {
  yield takeEvery(str(flows.createJustificationThenPutActionIfSuccessful), function* createJustificationThenPutActionIfSuccessfulWorker(action) {
    const {
      justification,
      nextAction,
    } = action.payload
    const result = yield call(callApiForResource, api.createJustification(justification))
    if (!result.error) {
      return yield put(nextAction)
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
  createJustificationThenPutActionIfSuccessful(),
  apiFailureErrorMessages(),
  editorCommitEdit(),
  goToMainSearch(),
  createEntityThenView(),
  fetchAndBeginEditOfNewJustificationFromBasis(),

  showAlertForUnexpectedApiError(),
]