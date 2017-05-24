import { normalize } from 'normalizr';
import fetch from 'isomorphic-fetch'

import {logError} from './util'

const apiUrl = path => process.env.API_ROOT + path

export function fetchJson(endpoint, {init = {}, schema}) {
  const fullUrl = apiUrl(endpoint)
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
  return fetch(fullUrl, init)
      .then(response => {
        const contentType = response.headers.get('Content-Type')
        switch (contentType) {
          case 'application/json':
          case 'application/json; charset=utf-8':
            return response.json().then(
                json => ({ json, response }),
                error => {
                  logError(error)
                  return Promise.reject({
                    status: response.status,
                    error,
                  })
                }
            )
          default:
            const contentLength = response.headers.has('Content-Length') ?
                parseInt(response.headers.get('Content-Length'), 10) :
                0
            if (contentLength !== 0) {
              logError("Non-empty non-JSON response")
            }
            return { null, response }
        }
      })
      .then( ({ json, response }) => {
        if (!response.ok) {
          return Promise.reject({
            status: response.status,
            json
          })
        }

        return schema && json ? normalize(json, schema) : json
      })
}