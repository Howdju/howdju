// Quick-start: https://json-schema.org/understanding-json-schema/index.html
// Look here for some custom keywords: https://github.com/epoberezkin/ajv-keywords

const Ajv = require('ajv')
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
  // Perform full validation of formats
  format: 'full',
}).addSchema(values(schemas))
  .addSchema(definitionsSchema)
  // https://ajv.js.org/custom.html
  .addKeyword('isMoment', { 
    compile: function(schema) {
      return function(data) {
        return moment.isMoment(data)
      }
    } 
  })

function validate(schemaId, data) {
  const isValid = ajv.validate(schemaId, data)
  const errors = isValid ?
    {} :
    transformErrors(ajv.errors)
  return {isValid, errors}
}

// https://github.com/epoberezkin/ajv#validation-errors
function transformErrors(errors) {
  // Internationalize error messages: https://github.com/epoberezkin/ajv-i18n
  return reduce(errors, (transformed, error) => {
    let name
    if (error.dataPath === '') {
      // When a required property is missing, the dataPath is the empty string
      if (error.keyword === 'required') {
        name = error.params.missingProperty
      } else {
        throw new Error(`unsupported Ajv error ${JSON.stringify(error)}`)
      }
    } else {
      // Ajv dataPaths start with a root period
      name = error.dataPath.substr(1)
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
