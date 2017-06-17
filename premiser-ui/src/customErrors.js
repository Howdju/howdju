import assign from 'lodash/assign'

export const customErrorTypes = {
  NETWORK_FAILURE_ERROR: 'NETWORK_FAILURE_ERROR',
  API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
  COMMIT_EDIT_RESULT_ERROR: 'COMMIT_EDIT_RESULT_ERROR',
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
export const newNetworkFailureError = sourceError => newCustomError(customErrorTypes.NETWORK_FAILURE_ERROR, null, sourceError)

export const newApiResponseError = (message, sourceError, httpStatusCode, body) =>
    newCustomError(customErrorTypes.API_RESPONSE_ERROR, message, sourceError, {httpStatusCode, body})

export const newEditorCommitResultError = (editorType, editorId, sourceError) =>
    newCustomError(customErrorTypes.COMMIT_EDIT_RESULT_ERROR, null, sourceError, {editorType, editorId})