import { ActionCreator, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { all, call, delay, put, race, take, takeEvery } from "typed-redux-saga";

import { api, ApiResponseActionMeta } from "howdju-client-common";

import config from "@/config";

export const slice = createSlice({
  name: "explorePage",
  initialState: {
    isFetching: false,
    didError: false,
  },
  reducers: {
    fetchData(state) {
      state.isFetching = true;
    },
    fetchDataSuccess(state) {
      state.isFetching = false;
      state.didError = false;
    },
    fetchDataFailure(state) {
      state.isFetching = false;
      state.didError = true;
    },
  },
});

export default slice.actions;
export const explorePage = slice.reducer;

export function* explorePageSaga() {
  yield all([fetchDatasaga()]);
}

function* fetchDatasaga() {
  yield takeEvery(
    slice.actions.fetchData,
    // TODO(#525) factor out the duplicate logic in these sagas. Use it in factCheckPageSliceSaga too.
    function* () {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(api.fetchExplorePageData());
      const { responseAction, timeout } = yield race({
        responseAction: call(
          getResponseAction,
          requestId,
          api.fetchExplorePageData.response
        ),
        timeout: delay(config.apiTimeoutMs),
      });
      if (responseAction) {
        if (!responseAction.error) {
          yield put(slice.actions.fetchDataSuccess());
        } else {
          yield put(slice.actions.fetchDataFailure());
        }
      } else if (timeout) {
        yield put(slice.actions.fetchDataFailure());
      } else {
        yield put(slice.actions.fetchDataFailure());
      }
    }
  );
}

function* getResponseAction<
  T extends PayloadAction<any, string, ApiResponseActionMeta<any, any>>
>(requestId: string, responseActionCreator: ActionCreator<any>) {
  while (true) {
    const resultAction: T = yield take(responseActionCreator);
    if (resultAction.meta.requestId === requestId) {
      return resultAction;
    }
  }
}
