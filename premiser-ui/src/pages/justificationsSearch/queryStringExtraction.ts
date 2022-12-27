import get from "lodash/get";
import pick from "lodash/pick";
import { isArray, mapValues } from "lodash";
import queryString from "query-string";

import {
  JustificationSearchFilters,
  ValidJustificationSearchFilters,
} from "howdju-common";
import { assert } from "console";

export const extractIncludeUrls = (locationSearch: string): boolean => {
  const value = get(queryString.parse(locationSearch), "includeUrls");
  if (!value) {
    return false;
  }
  assert(!isArray(value));
  return value === "true";
};

export const extractFilters = (
  locationSearch: string
): JustificationSearchFilters =>
  mapValues(
    pick(queryString.parse(locationSearch), ValidJustificationSearchFilters),
    (val) => (isArray(val) ? val[0] : val === null ? undefined : val)
  );
