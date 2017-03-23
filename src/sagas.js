import { put, call, takeEvery, takeLatest } from 'redux-saga/effects'

import {API_RESOURCE_ACTIONS} from "./actions";
import {resourceCalls} from "./api";

function* helloSaga() {
  console.log('Hello Sagas!')
}

function* fetchResource(action) {
  const apiMethod = resourceCalls[action.type]
  try {
    const result = yield call(apiMethod, action.payload)
    yield put({type: API_RESOURCE_ACTIONS[action.type]['SUCCESS'], payload: result})
  } catch (error) {
    yield put({type: API_RESOURCE_ACTIONS[action.type]['FAILURE'], payload: error})
  }
}

function* watchFetchStatements() {
  yield takeEvery([
      'FETCH_STATEMENTS',
      'FETCH_STATEMENT_JUSTIFICATIONS',
  ], fetchResource)
}

export default function* appSaga() {
  yield [
    helloSaga(),
    watchFetchStatements(),
  ]
}