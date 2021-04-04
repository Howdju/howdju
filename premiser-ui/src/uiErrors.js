import join from 'lodash/join'
import map from 'lodash/map'

import {newCustomError} from 'howdju-common'

export const uiErrorTypes = {
  NETWORK_FAILURE_ERROR: 'NETWORK_FAILURE_ERROR',
  API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
  REQUEST_CONFIGURATION_ERROR: 'REQUEST_CONFIGURATION_ERROR',
  COMMIT_EDIT_RESULT_ERROR: 'COMMIT_EDIT_RESULT_ERROR',
}

export const makeIdentifiersMessage = (message, identifiers) => {
  const identifierStrings = map(identifiers, (val, key) => `${key}: ${val}`)
  const identifiersString = join(identifierStrings, ', ')
  return `${message} (${identifiersString})`
}

/** The network call to the API failed */
export const newNetworkFailureError = (message, identifiers, sourceError) =>
  newCustomError(uiErrorTypes.NETWORK_FAILURE_ERROR, makeIdentifiersMessage(message, identifiers), sourceError, {
    ...identifiers,
    url: sourceError.config.url,
  })

export const newApiResponseError = (message, identifiers, sourceError) =>
  newCustomError(uiErrorTypes.API_RESPONSE_ERROR,
    makeIdentifiersMessage(`${message}: ${sourceError.response.data}`, identifiers),
    sourceError, {
      ...identifiers,
      httpStatusCode: sourceError.response.status,
      body: sourceError.response.data,
    })

export const newRequestConfigurationError = (message, identifiers, sourceError) =>
  newCustomError(uiErrorTypes.REQUEST_CONFIGURATION_ERROR, makeIdentifiersMessage(message, identifiers), sourceError, {
    ...identifiers,
    config: sourceError.config
  })

export const newEditorCommitResultError = (editorType, editorId, sourceError) => {
  const message = `Error committing ${editorType} editor ${editorId} (source error message: ${sourceError.message})`
  return newCustomError(uiErrorTypes.COMMIT_EDIT_RESULT_ERROR, message, sourceError, {editorType, editorId})
}

