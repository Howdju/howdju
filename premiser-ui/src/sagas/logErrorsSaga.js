import {
  delay
} from 'redux-saga'
import {
  put,
  call,
  takeEvery,
  select,
} from 'redux-saga/effects'
import find from 'lodash/find'
import pick from 'lodash/pick'
import isEmpty from 'lodash/isEmpty'

import {
  selectLoggedErrors,
} from "../selectors"
import {
  str,
  errors,
} from "../actions"
import {logger} from '../logger'
import * as customHeaderKeys from "../customHeaderKeys"


export function* logErrors() {

  yield takeEvery('*', function* logErrorsWorker(action) {
    if (!action.error) {
      return
    }

    const error = action.payload
    const loggedErrors = yield select(selectLoggedErrors)
    // Sometimes we wrap the same exception in multiple actions, such as callApi.response and then fetchPropositions.response
    // So don't log the same error multiple times
    if (!find(loggedErrors, e => e === error)) {
      // TODO mutating the store here.
      loggedErrors.push(error)
      const identifierKeys = pick(error, customHeaderKeys.identifierKeys)
      const options = isEmpty(identifierKeys) ? undefined : {extra: identifierKeys}
      logger.exception(error, options)
    }
  })

  yield takeEvery(str(errors.clearLoggedErrors), function* clearLoggedErrorsWorker(action) {
    // Periodically clear the logged errors since the find above is linear
    yield call(delay, 10000)
    yield put(errors.clearLoggedErrors())
  })
}
