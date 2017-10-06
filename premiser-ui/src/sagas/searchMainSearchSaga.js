import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  api,
  ui,
  app,
  str,
} from "../actions"


export function* searchMainSearch() {
  yield takeEvery(str(app.searchMainSearch), function* searchMainSearchWorker(action) {
    yield put(ui.mainSearchTextChange(action.payload.searchText))
    yield put(api.fetchMainSearchResults(action.payload.searchText))
  })
}