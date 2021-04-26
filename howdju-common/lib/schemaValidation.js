// Quick-start: https://json-schema.org/understanding-json-schema/index.html
// Look here for some custom keywords: https://github.com/epoberezkin/ajv-keywords

const {default: Ajv} = require('ajv')
const addFormats = require('ajv-formats')
const mapValues = require('lodash/mapValues')
const reduce = require('lodash/reduce')
const values = require('lodash/values')
const moment = require('moment')

const {
  schemas,
  definitionsSchema,
} = require('./schemas')

const schemaIds = mapValues(schemas, schema => schema['$id'])

const ajv = new Ajv({
  // https://github.com/epoberezkin/ajv#options
  // allow $data references
  $data: true,
  // report all errors with data, not just the first error
  allErrors: true,
  verbose: true,
}).addSchema(values(schemas))
  .addSchema(definitionsSchema)
  // https://ajv.js.org/custom.html
  .addKeyword({
    keyword: 'isMoment',
    type: 'object',
    validate(schema, data) {
      return moment.isMoment(data)
    }
  })
addFormats(ajv)

function validate(schemaOrRef, data) {
  const isValid = ajv.validate(schemaOrRef, data)
  const errors = isValid ?
    {} :
    transformErrors(ajv.errors)
  return {isValid, errors}
}

/** Transform the array of errors into an object keyed by the invalid data's path. */
function transformErrors(errors) {
  // Internationalize error messages: https://github.com/epoberezkin/ajv-i18n
  return reduce(errors, (transformed, error) => {
    let name
    if (error.instancePath === '') {
      // When a required property is missing, the instancePath is the empty string
      if (error.keyword === 'required') {
        name = error.params.missingProperty
      } else {
        throw new Error(`unsupported Ajv error ${JSON.stringify(error)}`)
      }
    } else {
      // Ajv instancePaths start with a root period
      name = error.instancePath.substr(1)
    }
    transformed[name] = {
      keyword: error.keyword,
      params: error.params,
    }
    return transformed
  }, {})
}

module.exports = {
  schemaIds,
  validate
}
