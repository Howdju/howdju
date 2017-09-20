import {
  delay
} from 'redux-saga'
import {
  take,
  put,
  call,
  select,
  race,
  takeEvery,
} from 'redux-saga/effects'
import {REHYDRATE} from 'redux-persist/constants'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'

import {request} from "../api"
import {
  selectAuthToken,
} from "../selectors"
import {
  api,
} from "../actions"
import {logger} from '../logger'
import config from "../config"
import {pageLoadId, getSessionStorageId} from "../identifiers"
import * as customHeaderKeys from "../customHeaderKeys"


export function* callApi(endpoint, schema, fetchInit = {}, requiresRehydrate = false) {
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

// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false

export function* flagRehydrate() {
  yield takeEvery(REHYDRATE, function* flagRehydrateWorker() {
    isRehydrated = true
  })
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