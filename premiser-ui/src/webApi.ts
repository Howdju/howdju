import {
  AnyApiAction,
  callApiForResource as commonCallApiForResource,
  FetchHeaders,
} from "howdju-client-common";

import { pageLoadId, getSessionStorageId } from "./identifiers";
import { customHeaderKeys } from "howdju-common";
import { isEmpty, merge } from "lodash";

/** Adds web-specific identifiers to a resource API call. */
export function* callApiForResource<A extends AnyApiAction>(action: A) {
  const headers = getIdHeaders();
  const idAction = headers
    ? merge(action, { payload: { fetchInit: { headers } } })
    : action;
  yield* commonCallApiForResource(idAction);
}

function* getIdHeaders() {
  const idHeaders = {} as FetchHeaders;
  const sessionStorageId = getSessionStorageId();
  if (sessionStorageId) {
    idHeaders[customHeaderKeys.SESSION_STORAGE_ID] = sessionStorageId;
  }
  if (pageLoadId) {
    idHeaders[customHeaderKeys.PAGE_LOAD_ID] = pageLoadId;
  }

  return !isEmpty(idHeaders) ? idHeaders : undefined;
}
