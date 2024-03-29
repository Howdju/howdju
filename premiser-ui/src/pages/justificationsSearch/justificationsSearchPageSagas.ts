import { put, select, takeEvery } from "typed-redux-saga";
import { LOCATION_CHANGE } from "connected-react-router";
import { isEqual } from "lodash";

import { history } from "@/history";
import { isActivePath } from "@/routes";
import { selectJustificationSearchFilters } from "@/selectors";
import justificationsSearchPage from "./justificationsSearchPageSlice";
import { extractFilters } from "./queryStringExtraction";

/**
 * When the user navigates to a different justification search, reset the page
 */
export function* resetJustificationSearchPage() {
  yield takeEvery(
    LOCATION_CHANGE,
    function* resetJustificationSearchPageWorker() {
      if (isActivePath("searchJustifications")) {
        const locationFilters = extractFilters(history.location.search);
        const stateFilters = yield* select(selectJustificationSearchFilters);
        if (!isEqual(locationFilters, stateFilters)) {
          yield* put(justificationsSearchPage.clearSearch());
        }
      }
    }
  );
}
