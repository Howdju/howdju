import { AxiosError } from "axios";
import join from "lodash/join";
import map from "lodash/map";

import {
  apiErrorCodes,
  httpStatusCodes,
  isCustomError,
  newCustomError,
} from "howdju-common";
import { clientNetworkErrorTypes } from "howdju-client-common";

import { AxiosResponseError } from "./api";

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
    clientNetworkErrorTypes.NETWORK_FAILURE_ERROR,
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

export function isAuthenticationExpiredError(error: unknown) {
  return (
    error instanceof Error &&
    isApiResponseError(error) &&
    error.httpStatusCode === httpStatusCodes.UNAUTHORIZED &&
    error.body.errorCode === apiErrorCodes.AUTHENTICATION_EXPIRED
  );
}

export const newApiResponseError = (
  message: string,
  identifiers: Identifiers,
  sourceError: AxiosResponseError
) =>
  newCustomError(
    clientNetworkErrorTypes.API_RESPONSE_ERROR,
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
    clientNetworkErrorTypes.REQUEST_CONFIGURATION_ERROR,
    makeIdentifiersMessage(message, identifiers),
    sourceError,
    {
      ...identifiers,
      config: sourceError.config,
    }
  );

export const newInvalidUrlError = (message: string) =>
  newCustomError(clientNetworkErrorTypes.INVALID_URL, message);
