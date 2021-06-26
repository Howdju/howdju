// Quick-start: https://json-schema.org/understanding-json-schema/index.html
// Look here for some custom keywords: https://github.com/epoberezkin/ajv-keywords

const {default: Ajv} = require('ajv')
const addFormats = require('ajv-formats')
const {default: standaloneCode} = require("ajv/dist/standalone")
const mapValues = require('lodash/mapValues')
const assign = require('lodash/assign')
const pick = require('lodash/pick')
const set = require('lodash/set')
const reduce = require('lodash/reduce')
const values = require('lodash/values')

const {
  fromJson,
  toJson,
} = require('./general')
const {
  schemas,
  definitionsSchema,
} = require('./schemas')

function makeStandaloneCode() {
  const ajv = makeAjv({code: {source: true}})
  return standaloneCode(ajv)
}

const schemaIds = mapValues(schemas, schema => schema['$id'])

function makeAjv(extraOpts) {
  const opts = assign(
    {},
    {
      // https://github.com/epoberezkin/ajv#options
      // allow $data references
      $data: true,
      // report all errors with data, not just the first error
      allErrors: true,
      verbose: true,
    },
    extraOpts,
  )
  const ajv = new Ajv(opts)
    .addSchema(values(schemas))
    .addSchema(definitionsSchema)
  addFormats(ajv)
  return ajv
}

function makeStandaloneValidate(validateFunctions) {
  return function validate(schemaOrRef, data) {
    const validationFunction = validateFunctions[schemaOrRef]
    const jsonVal = toJsonVal(data)
    const isValid = validationFunction(jsonVal)
    const errors = isValid ?
      {} :
      transformErrors(validationFunction.errors)
    return {isValid, errors}
  }
}

function makeValidate(ajv) {
  return function validate(schemaOrRef, data) {
    const jsonVal = toJsonVal(data)
    const isValid = ajv.validate(schemaOrRef, jsonVal)
    const errors = isValid ?
      {} :
      transformErrors(ajv.errors)
    return {isValid, errors}
  }
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
      // Ajv instancePaths start with a root slash
      name = error.instancePath.substr(1)
    }
    set(transformed, name, pick(error, [
      "keyword",
      "message",
      "params",
    ]))
    return transformed
  }, {})
}

/** Convert val to a JSON compatible object. Useful for ensuring moments are converted to strings. */
function toJsonVal(val) {
  return fromJson(toJson(val))
}

function emptyValidationResult() {
  return {errors: {}}
}

module.exports = {
  emptyValidationResult,
  makeAjv,
  makeValidate,
  makeStandaloneCode,
  makeStandaloneValidate,
  schemaIds,
}
