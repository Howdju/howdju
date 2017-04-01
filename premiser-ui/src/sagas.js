import { put, call, takeEvery, takeLatest } from 'redux-saga/effects'

import {
  API_RESOURCE_ACTIONS,
  FETCH_STATEMENTS,
  FETCH_STATEMENT_JUSTIFICATIONS,
  LOGIN, LOGIN_SUCCESS, LOGIN_FAILURE
} from "./actions";
import {login, resourceCalls} from "./api";

function* callResource(action) {
  const apiMethod = resourceCalls[action.type]
  try {
    const result = yield call(apiMethod, action.payload)
    yield put({type: API_RESOURCE_ACTIONS[action.type]['SUCCESS'], payload: result})
  } catch (error) {
    yield put({type: API_RESOURCE_ACTIONS[action.type]['FAILURE'], payload: error})
  }
}

function* callLogin(action) {
  try {
    const result = yield call(login, action.payload)
    yield put({type: LOGIN_SUCCESS, payload: result})
  } catch (error) {
    yield put({type: LOGIN_FAILURE, payload: error})
  }
}

function* watchFetchResources() {
  yield takeEvery([
      FETCH_STATEMENTS,
      FETCH_STATEMENT_JUSTIFICATIONS,
  ], callResource)
}

function* watchLogin() {
  yield takeEvery(LOGIN, callLogin)
}

export default () => [
  watchLogin(),
  watchFetchResources(),
]