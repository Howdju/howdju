import { history } from "@/history"
import { isActivePath } from "@/routes"
import { selectJustificationSearchFilters } from "@/selectors"
import { LOCATION_CHANGE } from "connected-react-router"
import { isEqual } from "lodash"
import { put, select, takeEvery } from "redux-saga/effects"
import justificationsSearchPage from "./justificationsSearchPageSlice"
import { extractFilters } from "./queryStringExtraction"

/**
 * When the user navigates to a different justification search, reset the page
 */
 export function* resetJustificationSearchPage() {
  yield takeEvery(LOCATION_CHANGE, function* resetJustificationSearchPageWorker() {
    if (isActivePath("searchJustifications")) {
      const locationFilters = extractFilters(history.location.search)
      // TODO(1): explore typing with typed-redux-saga like https://github.com/redux-saga/redux-saga/issues/884#issuecomment-790932231
      const stateFilters: ReturnType<typeof selectJustificationSearchFilters> = yield select(selectJustificationSearchFilters)
      if (!isEqual(locationFilters, stateFilters)) {
        yield put(justificationsSearchPage.clearSearch())
      }
    }
  })
}
