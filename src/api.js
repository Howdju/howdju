import { normalize, schema } from 'normalizr';
import fetch from 'isomorphic-fetch'

const API_ROOT = 'http://localhost:3000/'

function callApi(endpoint, schema) {
  const fullUrl = API_ROOT + endpoint

  return fetch(fullUrl)
      .then(response => response.json().then(json => ({ json, response })))
      .then(({ json, response }) => {
        if (!response.ok) {
          return Promise.reject(json)
        }

        return normalize(json, schema)
      })
      .then(
          response => ({response}),
          error => ({error: error.message || 'Something bad happened'})
      )
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

export const fetchStatements = () => callApi('statements', statementsSchema)
export const fetchStatementJustifications = (statementId) => callApi(`statement/${statementId}?justifications`, statementJustificationsSchema)