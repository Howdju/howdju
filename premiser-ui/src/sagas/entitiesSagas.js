import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {
  JustificationRootTargetType,
  newExhaustedEnumError
} from 'howdju-common'

import {api, flows, str} from '../actions'
import {logger} from '../logger'

export function* deleteJustificationRootTargetTranslator() {
  yield takeEvery(str(flows.deleteJustificationRootTarget), function* deleteJustificationRootTargetWorker(action) {
    const {
      rootTargetType,
      rootTarget,
    } = action.payload
    switch (rootTargetType) {
      case JustificationRootTargetType.PROPOSITION: {
        yield put(api.deleteProposition(rootTarget))
        break
      }
      case JustificationRootTargetType.STATEMENT: {
        logger.error('deleting statements is unimplemented')
        break
      }
      default:
        throw newExhaustedEnumError()
    }
  })
}