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
  api,
  apiActionCreatorsByActionType,
  str,
} from "../actions"
import {logger} from '../logger'
import {resourceApiConfigs} from './resourceApiConfigs'
import {callApi} from './apiSagas'


export function* resourceApiCalls() {
  const actionTypes = values(api)
  yield takeEvery(actionTypes, callApiForResource)
}

const cancelableResourceCallTasks = {}

export function* callApiForResource(action) {
  const responseActionCreator = apiActionCreatorsByActionType[action.type].response

  try {
    // TODO(1): replace resourceApiConfigs with apiConfig from meta
    let config = resourceApiConfigs[action.type] || action.meta.apiConfig
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
  yield takeEvery(
    [
      str(api.cancelPropositionTextSuggestions),
      str(api.cancelWritTitleSuggestions),
      str(api.cancelMainSearchSuggestions),
      str(api.cancelTagNameSuggestions),
      str(api.cancelPersorgNameSuggestions),
    ],
    function* cancelCallApiForResourceWorker(action) {
      const {
        cancelTarget,
      } = action.payload

      let resourceApiConfig = resourceApiConfigs[cancelTarget]
      if (isFunction(resourceApiConfig)) {
        resourceApiConfig = resourceApiConfig(action.payload)
      }
      const {cancelKey} = resourceApiConfig

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
