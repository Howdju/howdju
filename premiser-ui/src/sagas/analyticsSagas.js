import {
  takeEvery,
} from 'redux-saga/effects'
import {LOCATION_CHANGE} from 'connected-react-router'

import analytics from "../analytics"

export function* sendPageView() {
  yield takeEvery(LOCATION_CHANGE, function* locationChangeWorker(action) {
    const location = action.payload
    analytics.sendPageView(location.pathname)
  })
}
