import { normalize } from 'normalizr';
import fetch from 'isomorphic-fetch'

import {logError} from './util'
import {
  newApiResponseError,
  newNetworkFailureError,
} from "./customErrors";

const apiUrl = path => process.env.API_ROOT + path

const extractResponseBodyJson = response => {
  const contentType = response.headers.get('Content-Type')
  switch (contentType) {
    case 'application/json':
    case 'application/json; charset=utf-8':
      return response.json().then(
          bodyJson => ({ bodyJson, response }),
          error => {
            logError(error)
            return Promise.reject(newApiResponseError("Invalid JSON", error, response.status))
          }
      )
    default:
      const contentLength = response.headers.has('Content-Length') ?
          parseInt(response.headers.get('Content-Length'), 10) :
          0
      if (contentLength !== 0) {
        logError("Non-empty non-JSON response; API only handles JSON content")
        return response.text().then(
          text => Promise.reject(newApiResponseError("Non-JSON response: " + text, null, response.status)),
          error => Promise.reject(newApiResponseError("Invalid response; error converting response to text", error, response.status))
        )
      }
      return { null, response }
  }
}

export function fetchJson(endpoint, {init = {}, schema}) {
  const fullUrl = apiUrl(endpoint)
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
  return fetch(fullUrl, init)
      .then(extractResponseBodyJson, error => {
        // Any way to detect difference between CORS failure and network failure here?
        // Might try a fetch with 'no-cors'
        throw newNetworkFailureError(error)
      })
      .then( ({ bodyJson, response }) => {
        if (!response.ok) {
          return Promise.reject(newApiResponseError("Api error response", null, response.status, bodyJson))
        }

        return schema && bodyJson ? normalize(bodyJson, schema) : bodyJson
      })
}