import { normalize } from 'normalizr'
import Axios, {CancelToken} from 'axios'
import { CANCEL } from 'redux-saga'

import {logger} from './util'
import {
  newApiResponseError,
  newNetworkFailureError, newRequestConfigurationError,
} from "./customErrors";
import * as httpMethods from "./httpMethods";

const axios = Axios.create({
  baseURL: process.env.API_ROOT,
  withCredentials: true,
});

export function request({endpoint, method, body, headers, schema}) {

  const source = CancelToken.source();

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
  if (Axios.isCancel(error)) {
    logger.debug('Request canceled', error.message);
  } else if (error.response) {
    throw newApiResponseError("Api error response", error)
  } else if (error.request) {
    throw newNetworkFailureError("Api request failed", error)
  } else {
    throw newRequestConfigurationError("Request configuration error", error)
  }
}