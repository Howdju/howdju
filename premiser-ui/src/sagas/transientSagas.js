import {
  all,
  delay,
  put,
  call,
  fork,
  takeEvery,
  cancel,
} from 'redux-saga/effects'
import map from 'lodash/map'

import {
  ui,
  str,
} from "../actions"
import config from "../config"

const delayedHideTransientTaskByTransientId = {}

function* tryCancelDelayedHideTransient(transientId) {
  const hideTask = delayedHideTransientTaskByTransientId[transientId]
  if (hideTask) {
    yield put(ui.cancelDelayedHideTransient(transientId))
  }
}

function* cancelDelayedHideTransient(transientId) {
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
  yield put(ui.tryCancelDelayedHideTransient(transientId))
  yield put(ui.hideTransient(transientId))
}

function* delayedHide(hideDelay, transientId, cause) {
  yield call(delay, hideDelay)
  yield put(ui.hideTransient(transientId, cause))
}

export default function* handleTransientInteractions() {

  yield takeEvery(str(ui.unhandledAppClick), function* unhandledAppClickWorker() {
    yield put(ui.hideAllTransients())
  })

  yield takeEvery(str(ui.hideAllTransients), function* hideAllTransientsWorker() {
    yield all(map(delayedHideTransientTaskByTransientId,
      (task, transientId) => task && call(hideTransient, transientId)
    ))
  })

  yield takeEvery(str(ui.beginInteractionWithTransient), function* beginInteractionWithTransientWorker(action) {
    const transientId = action.payload.transientId

    yield put(ui.tryCancelDelayedHideTransient(transientId))
    yield put(ui.showTransient(transientId))
    yield put(ui.hideOtherTransients(transientId))
  })

  yield takeEvery(str(ui.endInteractionWithTransient), function* endInteractionWithTransientWorker(action) {
    const transientId = action.payload.transientId
    const hideDelay = config.transientHideDelay

    yield put(ui.scheduleDelayedHideTransient(transientId, hideDelay))
  })

  yield takeEvery(str(ui.hideOtherTransients), function* hideOtherTransientsWorker(action) {
    const visibleTransientId = action.payload.visibleTransientId

    yield all(map(delayedHideTransientTaskByTransientId, (task, transientId) =>
      call(hideOtherTransient, visibleTransientId, transientId)
    ))
  })

  yield takeEvery(str(ui.scheduleDelayedHideTransient), function* scheduleDelayedHideTransientWorker(action) {
    const {
      transientId,
      hideDelay,
    } = action.payload

    yield put(ui.tryCancelDelayedHideTransient(transientId, action))
    delayedHideTransientTaskByTransientId[transientId] = yield fork(delayedHide, hideDelay, transientId, action)
  })

  yield takeEvery(str(ui.tryCancelDelayedHideTransient), function* cancelDelayedHideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield call(tryCancelDelayedHideTransient, transientId)
  })

  yield takeEvery(str(ui.cancelDelayedHideTransient), function* cancelDelayedHideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield call(cancelDelayedHideTransient, transientId)
  })

  yield takeEvery(str(ui.hideTransient), function* hideTransientWorker(action) {
    const transientId = action.payload.transientId

    yield put(ui.tryCancelDelayedHideTransient(transientId))
  })
}
