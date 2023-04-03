import join from "lodash/join";
import map from "lodash/map";

import { isCustomError, newCustomError } from "howdju-common";
import { EditorType } from "./reducers/editors";
import { EditorId } from "./types";
import { AxiosError } from "axios";
import { AxiosResponseError } from "./api";

export const uiErrorTypes = {
  NETWORK_FAILURE_ERROR: "NETWORK_FAILURE_ERROR",
  API_RESPONSE_ERROR: "API_RESPONSE_ERROR",
  REQUEST_CONFIGURATION_ERROR: "REQUEST_CONFIGURATION_ERROR",
  COMMIT_EDIT_RESULT_ERROR: "COMMIT_EDIT_RESULT_ERROR",
  INVALID_URL: "INVALID_URL",
};
export type UiErrorType = typeof uiErrorTypes[keyof typeof uiErrorTypes];

type Identifiers = { [key: string]: any };

export const makeIdentifiersMessage = (
  message: string,
  identifiers: Identifiers
) => {
  const identifierStrings = map(identifiers, (val, key) => `${key}: ${val}`);
  const identifiersString = join(identifierStrings, ", ");
  return `${message} (${identifiersString})`;
};

/** The network call to the API failed */
export const newNetworkFailureError = (
  message: string,
  identifiers: Identifiers,
  sourceError: AxiosError
) =>
  newCustomError(
    uiErrorTypes.NETWORK_FAILURE_ERROR,
    makeIdentifiersMessage(message, identifiers),
    sourceError,
    {
      ...identifiers,
      url: sourceError.config?.url,
    }
  );

export type ApiResponseError = ReturnType<typeof newApiResponseError>;

export function isApiResponseError(val: Error): val is ApiResponseError {
  return isCustomError(val) && val.errorType === "API_RESPONSE_ERROR";
}

export const newApiResponseError = (
  message: string,
  identifiers: Identifiers,
  sourceError: AxiosResponseError
) =>
  newCustomError(
    uiErrorTypes.API_RESPONSE_ERROR,
    makeIdentifiersMessage(
      `${message}: ${sourceError.response.data}`,
      identifiers
    ),
    sourceError,
    {
      ...identifiers,
      httpStatusCode: sourceError.response.status,
      body: sourceError.response.data,
    }
  );

export const newRequestConfigurationError = (
  message: string,
  identifiers: Identifiers,
  sourceError: AxiosError
) =>
  newCustomError(
    uiErrorTypes.REQUEST_CONFIGURATION_ERROR,
    makeIdentifiersMessage(message, identifiers),
    sourceError,
    {
      ...identifiers,
      config: sourceError.config,
    }
  );

export const newEditorCommitResultError = (
  editorType: EditorType,
  editorId: EditorId,
  sourceError: Error
) => {
  const message = `Error committing ${editorType} editor ${editorId} (source error message: ${sourceError.message})`;
  return newCustomError(
    uiErrorTypes.COMMIT_EDIT_RESULT_ERROR,
    message,
    sourceError,
    { editorType, editorId }
  );
};

export const newInvalidUrlError = (message: string) =>
  newCustomError(uiErrorTypes.INVALID_URL, message);
