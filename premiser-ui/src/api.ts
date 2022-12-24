import Axios, { AxiosError, AxiosResponse, Cancel } from "axios";
import get from "lodash/get";
import pick from "lodash/pick";
import { CANCEL } from "redux-saga";

import { HttpMethod, httpMethods } from "howdju-common";

import { logger } from "./logger";
import {
  makeIdentifiersMessage,
  newApiResponseError,
  newNetworkFailureError,
  newRequestConfigurationError,
} from "./uiErrors";
import { newId } from "./identifiers";
import * as customHeaderKeys from "./customHeaderKeys";
import config from "./config";

const axios = Axios.create({
  baseURL: config.apiRoot,
  withCredentials: true,
});

export interface RequestOptions {
  endpoint: string;
  method: HttpMethod;
  body: string;
  headers: Record<string, string>;
}

export function request({ endpoint, method, body, headers }: RequestOptions) {
  const controller = new AbortController();

  const requestId = newId();
  headers = { ...headers, [customHeaderKeys.REQUEST_ID]: requestId };

  // https://github.com/mzabriskie/axios#request-config
  const promise = axios
    .request({
      url: endpoint,
      method: method || httpMethods.GET,
      headers: headers,
      data: body,
      signal: controller.signal,
      // onUploadProgress
      // onDownloadProgress
    })
    // https://github.com/mzabriskie/axios#response-schema
    .then((response) => response.data)
    .catch(handleError);

  // Allows canceling the request when sagas are canceled
  // https://github.com/redux-saga/redux-saga/issues/651#issuecomment-262375964
  // https://github.com/redux-saga/redux-saga/issues/701#issuecomment-267512606
  // (promise as any)[CANCEL] = controller.abort;
  (promise as any)[CANCEL] = () => {
    controller.abort();
  };

  return promise;
}

const handleError = (error: Error | AxiosError | Cancel) => {
  const headers = get(error, ["config", "headers"]);
  const identifierHeaders = pick(headers, customHeaderKeys.identifierKeys);
  if (Axios.isAxiosError(error)) {
    if (error.response) {
      throw newApiResponseError(
        `Api error response ${JSON.stringify(error.response.data)}`,
        identifierHeaders,
        error as AxiosResponseError
      );
    } else if (error.request) {
      throw newNetworkFailureError(
        "Api request failed",
        identifierHeaders,
        error
      );
    } else if (error.config) {
      throw newRequestConfigurationError(
        "Request configuration error",
        identifierHeaders,
        error
      );
    }
  } else if (Axios.isCancel(error)) {
    logger.debug(
      makeIdentifiersMessage("Request canceled", {
        [customHeaderKeys.REQUEST_ID]:
          identifierHeaders[customHeaderKeys.REQUEST_ID],
      }),
      error.message
    );
  } else {
    throw error;
  }
};

export interface AxiosResponseError extends AxiosError {
  response: AxiosResponse<any>;
}
