import {
  put,
  fork,
  join,
  takeEvery,
  cancel,
  cancelled,
} from 'redux-saga/effects'
import isFunction from 'lodash/isFunction'
import keys from 'lodash/keys'

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
  const actionTypes = keys(resourceApiConfigs)
  yield takeEvery(actionTypes, callApiForResource)
}

const cancelableResourceCallTasks = {}

export function* callApiForResource(action) {
  const responseActionCreator = apiActionCreatorsByActionType[action.type].response

  try {
    let config = resourceApiConfigs[action.type]
    if (!config) {
      return yield put(responseActionCreator(newImpossibleError(`Missing resource API config for action type: ${action.type}`)))
    }
    const {endpoint, fetchInit, schema, requiresRehydrate, cancelKey} = isFunction(config) ?
      config(action.payload) :
      config

    if (cancelKey) {
      const prevTask = cancelableResourceCallTasks[cancelKey]
      if (prevTask) {
        yield cancel(prevTask)
      }
    }

    const task = yield fork(callApi, endpoint, schema, fetchInit, requiresRehydrate)

    if (cancelKey) {
      cancelableResourceCallTasks[cancelKey] = task
    }

    const apiResultAction = yield join(task)

    if (cancelKey) {
      delete cancelableResourceCallTasks[cancelKey]
    }

    const responseMeta = {
      schema,
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
