import { put, call, select } from "typed-redux-saga";
import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";

import { FetchHeaders, RequestOptions, sendRequest } from "../api";
import { selectAuthToken } from "../selectors";
import { callApiResponse } from "../apiActions";
import { tryWaitOnRehydrate } from "./appSagas";
import { pageLoadId, getSessionStorageId } from "../identifiers";
import * as customHeaderKeys from "../customHeaderKeys";

export type FetchInit = Omit<RequestOptions, "endpoint">;

export function* callApi(
  endpoint: string,
  fetchInit = {} as FetchInit,
  canSkipRehydrate = false
) {
  try {
    if (!canSkipRehydrate) {
      yield* tryWaitOnRehydrate();
    }

    fetchInit = cloneDeep(fetchInit);
    fetchInit.headers = yield* constructHeaders(fetchInit);

    const responseData = yield* call(sendRequest, { endpoint, ...fetchInit });
    const responseAction = callApiResponse(responseData);
    return yield* put(responseAction);
  } catch (error) {
    const responseAction = callApiResponse(error);
    return yield* put(responseAction);
  }
}

function* constructHeaders(fetchInit: FetchInit) {
  const headersUpdate = {} as FetchHeaders;
  // Add auth token to all API requests
  const authToken = yield* select(selectAuthToken);
  if (authToken) {
    headersUpdate.Authorization = `Bearer ${authToken}`;
  }
  const sessionStorageId = getSessionStorageId();
  if (sessionStorageId) {
    headersUpdate[customHeaderKeys.SESSION_STORAGE_ID] = sessionStorageId;
  }
  if (pageLoadId) {
    headersUpdate[customHeaderKeys.PAGE_LOAD_ID] = pageLoadId;
  }

  return isEmpty(headersUpdate)
    ? fetchInit.headers
    : { ...fetchInit.headers, ...headersUpdate };
}
