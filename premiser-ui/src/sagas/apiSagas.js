import {
  put,
  call,
  select,
} from 'redux-saga/effects'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'

import {request} from "../api"
import {
  selectAuthToken,
} from "../selectors"
import {
  callApiResponse
} from "../apiActions"
import {tryWaitOnRehydrate} from './appSagas'
import {pageLoadId, getSessionStorageId} from "../identifiers"
import * as customHeaderKeys from "../customHeaderKeys"


export function* callApi(endpoint, fetchInit = {}, canSkipRehydrate = false) {
  try {
    if (!canSkipRehydrate) {
      yield* tryWaitOnRehydrate()
    }

    fetchInit = cloneDeep(fetchInit)
    fetchInit.headers = yield* constructHeaders(fetchInit)

    const result = yield call(request, {endpoint, ...fetchInit})
    return yield put(callApiResponse(result))
  } catch (error) {
    return yield put(callApiResponse(error))
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
