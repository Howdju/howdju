const assign = require('lodash/assign')

const {
  arrayToObject
} = require('./general')

const _e = module.exports

const commonErrorTypes = _e.commonErrorTypes = arrayToObject([
  'PROGRAMMING_ERROR',
  'IMPOSSIBLE_ERROR',
  'ARGUMENTS_EXCEPTION',
  'EXHAUSTED_ENUM',
  'UNIMPLEMENTED_ERROR',
])

// Customize JSON serialization of Error
if (!('toJSON' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      const jsonObj = {}

      Object.getOwnPropertyNames(this).forEach(function (key) {
        jsonObj[key] = this[key];
      }, this)

      return jsonObj
    },
    configurable: true,
    writable: true
  })
}

/* Identify custom errors with an errorType property.  Subclassing builtins like Error is not widely supported,
 * and the Babel plugin for doing so relies on static detection, which could be flakey
 */
const newCustomError = _e.newCustomError = (errorType, message, sourceError, props) => {
  const error = new Error(message)
  error.errorType = errorType
  if (sourceError) {
    error.sourceError = sourceError
  }
  assign(error, props)
  return error
}

_e.newImpossibleError = (message) =>
  newCustomError(commonErrorTypes.IMPOSSIBLE_ERROR, message)

_e.newProgrammingError = (message) =>
  newCustomError(commonErrorTypes.PROGRAMMING_ERROR, message)

_e.newArgumentsError = (message) =>
  newCustomError(commonErrorTypes.ARGUMENTS_EXCEPTION, message)

_e.newExhaustedEnumError = (enumName, value, message) => {
  message = message ? ' - ' + message : ''
  return newCustomError(commonErrorTypes.EXHAUSTED_ENUM, `Exhausted ${enumName} with ${value}${message}`)
}

_e.newUnimplementedError = (message) =>
  newCustomError(commonErrorTypes.UNIMPLEMENTED_ERROR, message)
