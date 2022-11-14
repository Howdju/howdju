import { put, takeEvery } from "redux-saga/effects"
import includes from "lodash/includes"
import get from "lodash/get"

import { apiErrorCodes } from "howdju-common"

import t, {
  THAT_JUSTIFICATION_ALREADY_EXISTS,
  THAT_PROPOSITION_ALREADY_EXISTS,
  THAT_STATEMENT_ALREADY_EXISTS,
  YOU_ARE_LOGGED_IN_AS,
  YOU_HAVE_BEEN_LOGGED_OUT,
  A_NETWORK_ERROR_OCCURRED,
  AN_UNEXPECTED_ERROR_OCCURRED,
  DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  DELETE_PROPOSITION_FAILURE_TOAST_MESSAGE,
  DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
  VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
} from "@/texts"
import { api, str } from "@/actions"
import { callApiResponse } from "@/apiActions"
import app from "@/app/appSlice"
import { logger } from "../logger"
import { uiErrorTypes } from "../uiErrors"

export function* showAlertForLogin() {
  yield takeEvery(
    api.login.response,
    function* showAlertForLoginWorker(action) {
      if (!action.error) {
        yield put(
          app.addToast(t(YOU_ARE_LOGGED_IN_AS, action.payload.user.email))
        )
      }
    }
  )
}

export function* showAlertForLogout() {
  yield takeEvery(
    api.logout.response,
    function* showAlertForLogoutWorker(action) {
      if (!action.error) {
        yield put(app.addToast(t(YOU_HAVE_BEEN_LOGGED_OUT)))
      }
    }
  )
}

export function* showAlertForExtantEntities() {
  const toastMessageKeys = {
    [str(api.createProposition.response)]: THAT_PROPOSITION_ALREADY_EXISTS,
    [str(api.createStatement.response)]: THAT_STATEMENT_ALREADY_EXISTS,
    [str(api.createJustification.response)]:
      THAT_JUSTIFICATION_ALREADY_EXISTS,
  }

  yield takeEvery(
    [
      api.createProposition.response,
      api.createStatement.response,
      api.createJustification.response,
    ],
    function* showAlertForExtantEntitiesWorker(action) {
      if (!action.error) {
        if (action.payload.isExtant) {
          const toastMessageKey = toastMessageKeys[action.type]
          yield put(app.addToast(t(toastMessageKey)))
        }
      }
    }
  )
}

export function* apiFailureAlerts() {
  const messageKeysByActionType = {
    [str(api.deleteProposition.response)]:
      DELETE_PROPOSITION_FAILURE_TOAST_MESSAGE,
    [str(api.deleteJustification.response)]:
      DELETE_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [str(api.verifyJustification.response)]:
      VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [str(api.unVerifyJustification.response)]:
      UN_VERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [str(api.disverifyJustification.response)]:
      DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [str(api.unDisverifyJustification.response)]:
      UN_DISVERIFY_JUSTIFICATION_FAILURE_TOAST_MESSAGE,
    [str(api.tagProposition.response)]: "Unable to create the tag",
    [str(api.antiTagProposition.response)]: "Unable to remove the tag",
    [str(api.unTagProposition.response)]: "Unable to remove the tag",
  }

  yield takeEvery(
    [
      api.deleteProposition.response,
      api.deleteJustification.response,
      api.verifyJustification.response,
      api.unVerifyJustification.response,
      api.disverifyJustification.response,
      api.unDisverifyJustification.response,
      api.tagProposition.response,
      api.antiTagProposition.response,
      api.unTagProposition.response,
    ],
    function* (action) {
      if (action.error) {
        const messageKey = messageKeysByActionType[action.type]
        yield put(app.addToast(t(messageKey)))
      }
    }
  )
}

export function* showAlertForUnexpectedApiError() {
  yield takeEvery(
    callApiResponse,
    function* showAlertForUnexpectedApiErrorWorker(action) {
      if (action.error) {
        if (action.payload.errorType) {
          switch (action.payload.errorType) {
            case uiErrorTypes.NETWORK_FAILURE_ERROR: {
              yield put(app.addToast(t(A_NETWORK_ERROR_OCCURRED)))
              break
            }
            case uiErrorTypes.API_RESPONSE_ERROR: {
              const errorCode = get(action.payload, ["body", "errorCode"])
              if (!errorCode) {
                logger.error("API response error missing error code")
                yield put(app.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
              } else if (
                includes(
                  [
                    apiErrorCodes.ROUTE_NOT_FOUND,
                    apiErrorCodes.UNEXPECTED_ERROR,
                  ],
                  errorCode
                )
              ) {
                yield put(app.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
              }
              break
            }
            default: {
              logger.error(`Unexpected error type: ${action.payload}`)
              logger.error(action.payload)
              yield put(app.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
              break
            }
          }
        } else {
          logger.error(`${callApiResponse} missing errorType`)
          logger.error(`Unexpected error type: ${action.payload}`)
          logger.error(action.payload)
          yield put(app.addToast(t(AN_UNEXPECTED_ERROR_OCCURRED)))
        }
      }
    }
  )
}
