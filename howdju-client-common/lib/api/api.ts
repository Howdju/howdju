import Axios, { AxiosError, AxiosInstance, AxiosResponse, Cancel } from "axios";
import { get, pick } from "lodash";
import { CANCEL } from "redux-saga";

import {
  customHeaderKeys,
  HttpMethod,
  httpMethods,
  identifierHeaderKeys,
  toJson,
} from "howdju-common";

import { logger } from "../logging";
import {
  makeIdentifiersMessage,
  newApiResponseError,
  newNetworkFailureError,
  newRequestConfigurationError,
} from "./apiErrors";
import { newUuidId } from "../uuids";

export interface ApiConfig {
  apiRoot: string;
}

export class Api {
  private axios: AxiosInstance;
  constructor({ apiRoot }: ApiConfig) {
    this.axios = Axios.create({
      baseURL: apiRoot,
      withCredentials: true,
    });
  }

  sendRequest({ endpoint, method, body, headers, requestId }: RequestOptions) {
    const controller = new AbortController();

    if (!requestId) {
      requestId = newUuidId();
    }
    headers = { ...headers, [customHeaderKeys.REQUEST_ID]: requestId };

    // https://github.com/mzabriskie/axios#request-config
    const promise = this.axios
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
    (promise as any)[CANCEL] = () => {
      controller.abort();
    };

    return promise;
  }
}

export type FetchHeaders = Record<string, string>;

export interface RequestOptions {
  endpoint: string;
  method: HttpMethod;
  body: string;
  requestId?: string;
  headers: FetchHeaders;
}

export const handleError = (error: Error | AxiosError | Cancel) => {
  const headers = get(error, ["config", "headers"]);
  const identifierHeaders = pick(headers, identifierHeaderKeys);
  if (Axios.isAxiosError(error)) {
    if (error.response) {
      throw newApiResponseError(
        `Api error response ${toJson(error.response.data)}`,
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
