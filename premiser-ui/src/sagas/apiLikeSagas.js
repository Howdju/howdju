import {
  put,
  takeEvery,
} from 'redux-saga/effects'

import {api, apiLike, str} from '../actions'
import {JustificationRootTargetType, newExhaustedEnumError} from '../../../howdju-common/lib'
import {logger} from '../logger'


export function* deleteJustificationRootTargetTranslator() {
  yield takeEvery(str(apiLike.deleteJustificationRootTarget), function* deleteJustificationRootTargetWorker(action) {
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

export function* fetchJustificationTargets() {
  yield takeEvery(str(apiLike.fetchJustificationTargets), function* fetchJustificationTargetsWorker(action) {
    const {
      targetInfos,
    } = action.payload
    for (const targetInfo of targetInfos) {
      const {
        targetType,
        targetId,
      } = targetInfo
      switch (targetType) {
        case JustificationRootTargetType.PROPOSITION: {
          yield put(api.fetchProposition(targetId))
          break
        }
        case JustificationRootTargetType.STATEMENT: {
          logger.error('fetching statement by ID is unimplemented')
          break
        }
        case JustificationRootTargetType.JUSTIFICATION: {
          logger.error('fetching justification by ID is unimplemented')
          break
        }
        default:
          throw newExhaustedEnumError()
      }
    }

  })
}