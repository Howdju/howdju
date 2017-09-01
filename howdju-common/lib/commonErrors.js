const assign = require('lodash/assign')

const _e = module.exports

const commonErrorTypes = _e.commonErrorTypes = {
  PROGRAMMING_ERROR: 'PROGRAMMING_ERROR',
  IMPOSSIBLE_ERROR: 'IMPOSSIBLE_ERROR',
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