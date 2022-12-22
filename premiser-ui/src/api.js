import Axios, { CancelToken } from "axios";
import get from "lodash/get";
import pick from "lodash/pick";
import { CANCEL } from "redux-saga";

import { httpMethods } from "howdju-common";

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

export function request({ endpoint, method, body, headers }) {
  const source = CancelToken.source();

  const requestId = newId();
  headers = { ...headers, [customHeaderKeys.REQUEST_ID]: requestId };

  // https://github.com/mzabriskie/axios#request-config
  const request = axios
    .request({
      url: endpoint,
      method: method || httpMethods.GET,
      headers: headers,
      data: body,
      cancelToken: source.token,
      // onUploadProgress
      // onDownloadProgress
    })
    // https://github.com/mzabriskie/axios#response-schema
    .then((response) => response.data)
    .catch(handleError);

  // Allows canceling the request when sagas are canceled
  // https://github.com/redux-saga/redux-saga/issues/651#issuecomment-262375964
  // https://github.com/redux-saga/redux-saga/issues/701#issuecomment-267512606
  request[CANCEL] = source.cancel;

  return request;
}

const handleError = (error) => {
  const headers = get(error, ["config", "headers"]);
  const identifierHeaders = pick(headers, customHeaderKeys.identifierKeys);
  if (Axios.isCancel(error)) {
    logger.debug(
      makeIdentifiersMessage("Request canceled", {
        [customHeaderKeys.REQUEST_ID]:
          identifierHeaders[customHeaderKeys.REQUEST_ID],
      }),
      error.message
    );
  } else if (error.response) {
    throw newApiResponseError(
      `Api error response ${JSON.stringify(error.response.data)}`,
      identifierHeaders,
      error
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
  } else {
    throw error;
  }
};
