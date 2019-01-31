const assign = require('lodash/assign')

const {
  arrayToObject
} = require('./general')

const _e = module.exports

const commonErrorTypes = _e.commonErrorTypes = arrayToObject([
  /** Something happened that should have been avoidable (how does this differ from impossible?) */
  'PROGRAMMING_ERROR',
  
  /** Something happened that should not have been possible. */
  'IMPOSSIBLE_ERROR',
  
  /** We exhausted an enums values, but shouldn't have been able to.  This is a type of programming error. */
  'EXHAUSTED_ENUM',
  
  /** The required code path is purposefully unimplemented currently. */
  'UNIMPLEMENTED_ERROR',
])

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

_e.newExhaustedEnumError = (enumName, value, message) => {
  message = message ? ' - ' + message : ''
  return newCustomError(commonErrorTypes.EXHAUSTED_ENUM, `Exhausted ${enumName} with ${value}${message}`)
}

_e.newUnimplementedError = (message) =>
  newCustomError(commonErrorTypes.UNIMPLEMENTED_ERROR, message)
