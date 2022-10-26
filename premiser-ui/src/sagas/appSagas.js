import moment from 'moment'
import {
  delay,
  put, race,
  select, take, takeEvery,
} from 'redux-saga/effects'
import { REHYDRATE } from 'redux-persist/lib/constants'

import {
  app,
  ui,
} from '../actions'
import {
  selectAuthTokenExpiration,
  selectTagPageTagId,
} from "../selectors"
import config from '../config'
import {logger} from '../logger'
import {LOCATION_CHANGE} from 'connected-react-router'
import {getPathParam} from '../routes'


// API calls requiring authentication will want to wait for a rehydrate before firing
let isRehydrated = false

export function* flagRehydrate() {
  yield takeEvery(REHYDRATE, function* flagRehydrateWorker() {
    isRehydrated = true
  })
}

export function* checkAuthExpirationOnRehydrate() {
  yield takeEvery(REHYDRATE, function* checkAuthExpirationOnRehydrateWorker() {
    yield put(app.checkAuthExpiration())
  })
}

export function* tryWaitOnRehydrate() {
  if (!isRehydrated) {
    logger.debug('Waiting on rehydrate')
    const {rehydrate, timeout} = yield race({
      rehydrate: take(REHYDRATE),
      timeout: delay(config.rehydrateTimeoutMs),
    })
    if (rehydrate) {
      logger.debug('Proceeding after rehydrate')
    } else if (timeout) {
      logger.warn('Timed out waiting for rehydrate')
    } else {
      logger.error('Unknown rehydrate race condition')
    }
  }
}

export function* checkAuthExpirationPeriodically() {
  while (true) {
    yield put(app.checkAuthExpiration())
    yield delay(config.authExpirationCheckFrequencyMs)
  }
}

export function* checkAuthExpiration() {
  yield takeEvery(app.checkAuthExpiration, function* checkAuthExpirationWorker() {
    const authTokenExpiration = yield select(selectAuthTokenExpiration)
    if (authTokenExpiration && moment.utc().isAfter(moment.utc(authTokenExpiration))) {
      yield put(app.clearAuthToken())
    }
  })
}


/**
 * When the user navigates to a different tag, reset the page
 */
export function* resetTagPage() {
  yield takeEvery(LOCATION_CHANGE, function* resetTagPage() {
    const tagId = getPathParam("tag", 'tagId')
    if (tagId) {
      const tagPageTagId = yield select(selectTagPageTagId)
      if (tagId !== tagPageTagId) {
        yield put(ui.clearTaggedPropositions())
      }
    }
  })
}
