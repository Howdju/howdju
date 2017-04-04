import { normalize } from 'normalizr';
import fetch from 'isomorphic-fetch'

import {logError} from './util'

const apiUrl = path => process.env.API_ROOT + path

export function fetchJson(endpoint, {init = {}, schema}) {
  const fullUrl = apiUrl(endpoint)
  return fetch(fullUrl, init)
      .then(response => {
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
          return Promise.reject(json)
        }

        return schema ? normalize(json, schema) : json
      })
}