import {
  delay
} from 'redux-saga'
import {
  take,
  put,
  call,
  fork,
  join,
  takeEvery,
  select,
  race,
  cancel,
  cancelled,
} from 'redux-saga/effects'
import map from 'lodash/map'

import {
  ui,
  str,
} from "../actions";
import config from "../config";

const delayedHideTransientTaskByTransientId = {}

function* tryCancelHideTransient(transientId) {
  // console.log(transientId, delayedHideTransientTaskByTransientId)
  const hideTask = delayedHideTransientTaskByTransientId[transientId]
  if (hideTask) {
    yield put(ui.cancelHideTransient(transientId))
  }
}

function* cancelHideTransient(transientId) {
  const hideTask = delayedHideTransientTaskByTransientId[transientId]
  delayedHideTransientTaskByTransientId[transientId] = null
  yield cancel(hideTask)
}

function* hideOtherTransient(visibleTransientId, transientId) {
  if (transientId !== visibleTransientId) {
    yield call(hideTransient, transientId)
  }
}

function* hideTransient(transientId) {
  yield put(ui.tryCancelHideTransient(transientId))
  yield put(ui.hideTransient(transientId))
}

function* delayedHide(hideDelay, transientId) {
  yield call(delay, hideDelay)
  yield put(ui.hideTransient(transientId))
}

export default function* handleTransientInteractions() {

  yield takeEvery(str(ui.unhandledAppClick), function* unhandledAppClickWorker() {
    yield put(ui.hideAllTransients())
  })

  yield takeEvery(str(ui.hideAllTransients), function* hideAllTransientsWorker() {
    yield map(delayedHideTransientTaskByTransientId, (task, transientId) => call(hideTransient, transientId))
  })

  yield takeEvery(str(ui.beginInteractionWithTransient), function* beginInteractionWithTransientWorker(action) {
    const transientId = action.payload.transientId

    yield put(ui.tryCancelHideTransient(transientId))
    yield put(ui.showTransient(transientId))
    yield put(ui.hideOtherTransients(transientId))
  })

  yield takeEvery(str(ui.endInteractionWithTransient), function* endInteractionWithTransientWorker(action) {
    const transientId = action.payload.transientId
    const hideDelay = config.transientHideDelay

    yield put(ui.scheduleHideTransient(transientId, hideDelay))
  })

  yield takeEvery(str(ui.hideOtherTransients), function* hideOtherTransientsWorker(action) {
    const visibleTransientId = action.payload.visibleTransientId

    // TODO update to yield all([...]) in v0.15
    yield map(delayedHideTransientTaskByTransientId, (task, transientId) =>
        call(hideOtherTransient, visibleTransientId, transientId))
  })

  yield takeEvery(str(ui.scheduleHideTransient), function* scheduleHideTransientWorker(action) {
    const {
      transientId,
      hideDelay,
    } = action.payload

    yield put(ui.tryCancelHideTransient(transientId))
    delayedHideTransientTaskByTransientId[transientId] = yield fork(delayedHide, hideDelay, transientId)
  })

  yield takeEvery(str(ui.tryCancelHideTransient), function* cancelHideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield call(tryCancelHideTransient, transientId)
  })

  yield takeEvery(str(ui.cancelHideTransient), function* cancelHideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield call(cancelHideTransient, transientId)
  })

  yield takeEvery(str(ui.hideTransient), function* hideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield put(ui.tryCancelHideTransient(transientId))
  })
}