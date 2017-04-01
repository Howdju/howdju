import { normalize, schema } from 'normalizr';
import fetch from 'isomorphic-fetch'
import {FETCH_STATEMENTS, FETCH_STATEMENT_JUSTIFICATIONS} from "./actions";

const apiUrl = path => process.env.API_ROOT + path

export function callApi(endpoint, {init, schema}) {
  const fullUrl = apiUrl(endpoint)
  return fetch(fullUrl, init)
      .then(response => response.json().then(json => ({ json, response })))
      .then(({ json, response }) => {
        if (!response.ok) {
          return Promise.reject(json)
        }

        return schema ? normalize(json, schema) : json
      })
}

export const statementSchema = new schema.Entity('statements');
export const statementsSchema = [statementSchema]
export const quoteSchema = new schema.Entity('quotes')

export const justificationTargetSchema = new schema.Union({}, (value, parent) => parent.type)
export const justificationBasisSchema = new schema.Union({
  STATEMENT: statementSchema,
  QUOTE: quoteSchema
}, (value, parent) => parent.type)
export const justificationSchema = new schema.Entity('justifications', {
  target: {
    entity: justificationTargetSchema
  },
  basis: {
    entity: justificationBasisSchema
  }
})
// The docs say that this definition is merged, but for me it appeared to overwrite what was there.
justificationTargetSchema.define({
  STATEMENT: statementSchema,
  JUSTIFICATION: justificationSchema,
})

export const statementJustificationsSchema = {
  statement: statementSchema,
  justifications: [justificationSchema]
}

export const login = (credentials) => callApi('login', {init: {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({credentials}),
}})

// These methods translate FETCH_* payloads into API calls
export const resourceCalls = {
  [FETCH_STATEMENTS]: () => callApi('statements', {schema: statementsSchema}),
  [FETCH_STATEMENT_JUSTIFICATIONS]: (statementId) =>
      callApi(`statements/${statementId}?justifications`, {schema: statementJustificationsSchema}),
}