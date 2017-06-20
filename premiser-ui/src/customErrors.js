import assign from 'lodash/assign'

export const customErrorTypes = {
  NETWORK_FAILURE_ERROR: 'NETWORK_FAILURE_ERROR',
  API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
  REQUEST_CONFIGURATION_ERROR: 'REQUEST_CONFIGURATION_ERROR',
  COMMIT_EDIT_RESULT_ERROR: 'COMMIT_EDIT_RESULT_ERROR',
  PROGRAMMING_ERROR: 'PROGRAMMING_ERROR',
  IMPOSSIBLE_ERROR: 'IMPOSSIBLE_ERROR',
}

/* Identify custom errors with a errorType property.  Subclassing builtins like Error is not widely supported,
 * and the Babel plugin for doing so relies on static detection, which could be flakey
 */
const newCustomError = (errorType, message, sourceError, props) => {
  const error = new Error(message)
  error.errorType = errorType
  if (sourceError) {
    error.sourceError = sourceError
  }
  assign(error, props)
  return error
}

/** The network call to the API failed */
export const newNetworkFailureError = sourceError =>
    newCustomError(customErrorTypes.NETWORK_FAILURE_ERROR, 'Network failure', sourceError)

export const newApiResponseError = (message, sourceError) =>
    newCustomError(customErrorTypes.API_RESPONSE_ERROR, message, sourceError, {
      httpStatusCode: sourceError.response.status,
      body: sourceError.response.data,
    })

export const newRequestConfigurationError = (message, sourceError) =>
    newCustomError(customErrorTypes.REQUEST_CONFIGURATION_ERROR, message, sourceError, {config: sourceError.config})

export const newEditorCommitResultError = (editorType, editorId, sourceError) =>
    newCustomError(customErrorTypes.COMMIT_EDIT_RESULT_ERROR, null, sourceError, {editorType, editorId})

export const newProgrammingError = (message) =>
    newCustomError(customErrorTypes.PROGRAMMING_ERROR, message)

export const newImpossibleError = (message) =>
    newCustomError(customErrorTypes.IMPOSSIBLE_ERROR, message)