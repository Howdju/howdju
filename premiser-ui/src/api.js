import { normalize } from 'normalizr';
import fetch from 'isomorphic-fetch'

import {logError} from './util'

const apiUrl = path => process.env.API_ROOT + path

export function fetchJson(endpoint, {init = {}, schema}) {
  const fullUrl = apiUrl(endpoint)
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
  return fetch(fullUrl, init)
      .then(response => {
        if (response.status === 204) {
          // 204 are not allowed to have a body https://httpstatuses.com/204
          return { null, response }
        }
        return response.json().then(
            json => ({ json, response }),
            error => {
              logError(error)
              return Promise.reject(error)
            }
        )
      })
      .then(({ json, response }) => {
        if (!response.ok) {
          return Promise.reject({
            status: response.status,
            json
          })
        }

        return schema && json ? normalize(json, schema) : json
      })
}