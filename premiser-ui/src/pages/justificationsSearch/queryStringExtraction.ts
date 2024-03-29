import get from "lodash/get";
import pick from "lodash/pick";
import { isArray, mapValues } from "lodash";
import queryString from "query-string";

import {
  JustificationSearchFilters,
  ExternalJustificationSearchFilters,
} from "howdju-common";

export const extractIncludeUrls = (locationSearch: string) =>
  !!get(queryString.parse(locationSearch), "includeUrls");

export const extractFilters = (
  locationSearch: string
): JustificationSearchFilters =>
  mapValues(
    pick(queryString.parse(locationSearch), ExternalJustificationSearchFilters),
    (val) => (isArray(val) ? val[0] : val === null ? undefined : val)
  );
