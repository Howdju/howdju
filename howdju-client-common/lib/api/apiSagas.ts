import { put, call, select, getContext } from "typed-redux-saga";
import { cloneDeep, isEmpty, pick } from "lodash";

import { identifierHeaderKeys } from "howdju-common";

import { callApiResponse } from "./apiActionHelpers";
import { api } from "./apiActions";
import { Api, FetchHeaders } from "./api";
import { selectAuthToken } from "../auth/authSelectors";
import { tryWaitOnRehydrate } from "@/hydration/hydrationSagas";
import { isAuthenticationExpiredError } from "./apiErrors";
import { logger } from "../logging";
import { FetchInit } from "./apiActionTypes";

export function* callApi(
  endpoint: string,
  fetchInit = {} as FetchInit,
  canSkipRehydrate = false
) {
  let authRefreshAttemptNumber = 0;
  while (true) {
    try {
      if (!canSkipRehydrate) {
        yield* tryWaitOnRehydrate();
      }

      fetchInit = cloneDeep(fetchInit);
      fetchInit.headers = yield* constructHeaders(fetchInit);

      const api = yield* getContext<Api>("api");
      if (!api) {
        throw new Error("api was missing from redux-saga's context.");
      }
      const responseData = yield* call(api.sendRequest.bind(api), {
        endpoint,
        ...fetchInit,
      });
      const responseAction = callApiResponse(responseData);
      return yield* put(responseAction);
    } catch (error) {
      if (isAuthenticationExpiredError(error) && authRefreshAttemptNumber < 1) {
        yield* put(api.refreshAuth());
        authRefreshAttemptNumber += 1;
        continue;
      }
      logApiError(error, endpoint);
      const responseAction = callApiResponse(error);
      return yield* put(responseAction);
    }
  }
}

function logApiError(error: unknown, endpoint: string) {
  if (!(error instanceof Error)) {
    logger.warn(
      `logApiError called with non-Error object. Type: ${typeof error}`
    );
    return;
  }
  const identifierKeys = pick(error, identifierHeaderKeys);
  const options = { extra: { endpoint } };
  if (!isEmpty(identifierKeys)) {
    options.extra = { ...options.extra, ...identifierKeys };
  }
  logger.error(error, options);
}

function* constructHeaders(fetchInit: FetchInit) {
  const headersUpdate = {} as FetchHeaders;
  // Add auth token to all API requests
  const authToken = yield* select(selectAuthToken);
  if (authToken) {
    headersUpdate.Authorization = `Bearer ${authToken}`;
  }

  return isEmpty(headersUpdate)
    ? fetchInit.headers
    : { ...fetchInit.headers, ...headersUpdate };
}
