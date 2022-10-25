import {
  put,
  fork,
  join,
  takeEvery,
  cancel,
  cancelled,
} from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import values from 'lodash/values'

import {
  newImpossibleError
} from 'howdju-common'

import {
  str,
} from "../actions"
import {
  api, apiActionCreatorsByActionType, cancelMainSearchSuggestions, cancelPersorgNameSuggestions, cancelPropositionTextSuggestions, cancelTagNameSuggestions, cancelWritTitleSuggestions
} from "../apiActions"
import {logger} from '../logger'
import {callApi} from './apiSagas'


export function* resourceApiCalls() {
  const actionTypes = values(api)
  yield takeEvery(actionTypes, callApiForResource)
}

const cancelableResourceCallTasks = {}

export function* callApiForResource(action) {
  const responseActionCreator = apiActionCreatorsByActionType[action.type].response

  try {
    // TODO(1): Move cancelation action creators out of api and make meta required.
    let config = action.meta && action.meta.apiConfig
    if (!config) {
      return yield put(responseActionCreator(newImpossibleError(`Missing resource API config for action type: ${action.type}`)))
    }
    const {endpoint, fetchInit, normalizationSchema, canSkipRehydrate, cancelKey} = isFunction(config) ?
      config(action.payload) :
      config

    if (cancelKey) {
      const prevTask = cancelableResourceCallTasks[cancelKey]
      if (prevTask) {
        yield cancel(prevTask)
      }
    }

    const task = yield fork(callApi, endpoint, fetchInit, canSkipRehydrate)

    if (cancelKey) {
      cancelableResourceCallTasks[cancelKey] = task
    }

    const apiResultAction = yield join(task)

    if (cancelKey) {
      delete cancelableResourceCallTasks[cancelKey]
    }

    const responseMeta = {
      normalizationSchema,
      requestPayload: action.payload,
    }
    return yield put(responseActionCreator(apiResultAction.payload, responseMeta))
  } catch (error) {
    return yield put(responseActionCreator(error))
  } finally {
    if (yield cancelled()) {
      logger.debug(`Canceled ${action.type}`)
    }
  }
}

export function* cancelResourceApiCalls() {
  // TODO(1): move cancel onto the API action creator to avoid toil of adding them here?
  yield takeEvery(
    [
      str(cancelPropositionTextSuggestions),
      str(cancelWritTitleSuggestions),
      str(cancelMainSearchSuggestions),
      str(cancelTagNameSuggestions),
      str(cancelPersorgNameSuggestions),
    ],
    function* cancelCallApiForResourceWorker(action) {
      const {
        cancelTarget,
      } = action.payload

      // Call the cancel target in order to get its cancelKey.
      let targetAction = apiActionCreatorsByActionType[cancelTarget](...action.payload.cancelTargetArgs)
      const {cancelKey} = targetAction

      if (cancelKey) {
        const prevTask = cancelableResourceCallTasks[cancelKey]
        if (prevTask) {
          delete cancelableResourceCallTasks[cancelKey]
          yield cancel(prevTask)
        }
      }
    }
  )
}
