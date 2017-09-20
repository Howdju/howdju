import {
  put,
  takeEvery,
} from 'redux-saga/effects'
import get from 'lodash/get'
import map from 'lodash/map'

import {
  apiErrorCodes,
} from 'howdju-common'

import t, {
  A_NETWORK_ERROR_OCCURRED,
  AN_UNEXPECTED_ERROR_OCCURRED,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  THAT_JUSTIFICATION_ALREADY_EXISTS,
  THAT_STATEMENT_ALREADY_EXISTS,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  YOU_ARE_LOGGED_IN_AS,
  YOU_HAVE_BEEN_LOGGED_OUT,
  DELETE_STATEMENT_FAILURE_TOAST_MESSAGE,
} from '../texts'
import {
  api,
  ui,
  str,
} from "../actions"
import {logger} from '../logger'
import {
  uiErrorTypes,
} from "../uiErrors"


export function* apiFailureAlerts() {
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

export function* showAlertForUnexpectedApiError() {
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

export function* showAlertForExtantEntities() {

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

export function* showAlertForLogin() {
  yield takeEvery(str(api.login.response), function* showAlertForLoginWorker(action) {
    if (!action.error) {
      yield put(ui.addToast(t(YOU_ARE_LOGGED_IN_AS, action.payload.user.email)))
    }
  })
}

export function* showAlertForLogout() {
  yield takeEvery(str(api.logout.response), function* showAlertForLogoutWorker(action) {
    if (!action.error) {
      yield put(ui.addToast(t(YOU_HAVE_BEEN_LOGGED_OUT)))
    }
  })
}
