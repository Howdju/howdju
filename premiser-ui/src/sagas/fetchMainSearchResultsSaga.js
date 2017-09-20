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


export function* fetchMainSearchResults() {
  yield takeEvery(str(app.fetchMainSearchResults), function* fetchMainSearchResultsWorker(action) {
    yield put(ui.mainSearchTextChange(action.payload.searchText))
    yield put(api.fetchStatementsSearch(action.payload.searchText))
  })
}