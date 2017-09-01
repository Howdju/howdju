import { normalize } from 'normalizr'
import Axios, {CancelToken} from 'axios'
import { CANCEL } from 'redux-saga'
import get from 'lodash/get'
import pick from 'lodash/pick'

import {logger} from './logger'
import {
  makeIdentifiersMessage,
  newApiResponseError,
  newNetworkFailureError,
  newRequestConfigurationError,
} from "./uiErrors"
import * as httpMethods from "./httpMethods"
import {newId} from "./identifiers"
import * as customHeaderKeys from "./customHeaderKeys"
import config from './config'

const axios = Axios.create({
  baseURL: config.apiRoot,
  withCredentials: true,
})

export function request({endpoint, method, body, headers, schema}) {

  const source = CancelToken.source()

  const requestId = newId()
  headers = {...headers, [customHeaderKeys.REQUEST_ID]: requestId}

  // https://github.com/mzabriskie/axios#request-config
  const request = axios.request({
    url: endpoint,
    method: method || httpMethods.GET,
    headers: headers,
    data: body,
    cancelToken: source.token,
    // onUploadProgress
    // onDownloadProgress
  })
    .then(response => {
      // https://github.com/mzabriskie/axios#response-schema
      const result = schema && response.data ? normalize(response.data, schema) : response.data
      return result
    })
    .catch(handleError)

  // Allows canceling the request when sagas are canceled
  // https://github.com/redux-saga/redux-saga/issues/651#issuecomment-262375964
  // https://github.com/redux-saga/redux-saga/issues/701#issuecomment-267512606
  request[CANCEL] = source.cancel

  return request
}

const handleError = error => {
  const headers = get(error, ['config', 'headers'])
  const identifierHeaders = pick(headers, customHeaderKeys.identifierKeys)
  if (Axios.isCancel(error)) {
    logger.debug(makeIdentifiersMessage('Request canceled', {[customHeaderKeys.REQUEST_ID]: identifierHeaders[customHeaderKeys.REQUEST_ID]}), error.message)
  } else if (error.response) {
    throw newApiResponseError("Api error response", identifierHeaders, error)
  } else if (error.request) {
    throw newNetworkFailureError("Api request failed", identifierHeaders, error)
  } else {
    throw newRequestConfigurationError("Request configuration error", identifierHeaders, error)
  }
}