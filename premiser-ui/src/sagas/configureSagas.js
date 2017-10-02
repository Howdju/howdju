import {
  takeEvery,
  select,
} from 'redux-saga/effects'
import {REHYDRATE} from 'redux-persist/constants'

import * as sentry from '../sentry'
import * as smallchat from "../smallchat"
import analytics from "../analytics"
import {
  selectUserExternalIds,
  selectUser,
} from '../selectors'
import {api, str} from '../actions'


export function* configureAfterLogin() {
  yield takeEvery(str(api.login.response), function* setSentryUserContextAfterLoginWorker(action) {
    if (!action.error) {
      const externalIds = yield select(selectUserExternalIds)
      const {
        sentryId,
        smallchatId,
      } = externalIds
      if (sentryId) {
        sentry.setUserContext(sentryId)
      }

      const {shortName, longName} = yield select(selectUser)
      if (smallchatId) {
        smallchat.identify(smallchatId, shortName, longName)
      }
      analytics.identify(externalIds)
    }
  })
}

export function* configureAfterRehydrate() {
  yield takeEvery(REHYDRATE, function* setSentryUserContextWorker() {
    const externalIds = yield select(selectUserExternalIds, {})
    const {sentryId} = externalIds
    if (sentryId) {
      sentry.setUserContext(sentryId)
    }
    analytics.identify(externalIds)
  })
}