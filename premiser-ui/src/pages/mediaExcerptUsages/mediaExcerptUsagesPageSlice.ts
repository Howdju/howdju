import { ActionCreator, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { normalize } from "normalizr";
import { all, call, delay, put, race, take, takeEvery } from "typed-redux-saga";

import { ContinuationToken, EntityId } from "howdju-common";

import { api, ApiResponseActionMeta } from "@/apiActions";
import config from "@/config";

export const slice = createSlice({
  name: "mediaExcerptUsagesPage",
  initialState: {
    isFetchingJustifications: false,
    justificationIds: [] as EntityId[],
    justificationsContinuationToken: undefined as ContinuationToken | undefined,
    isFetchingAppearances: false,
    appearanceIds: [] as EntityId[],
    appearancesContinuationToken: undefined as ContinuationToken | undefined,
  },
  reducers: {
    fetchJustifications(
      state,
      _action: PayloadAction<{
        mediaExcerptId: EntityId;
        continuationToken?: ContinuationToken;
      }>
    ) {
      state.isFetchingJustifications = true;
    },
    fetchJustificationsSuccess(
      state,
      action: PayloadAction<{
        justificationIds: EntityId[];
        continuationToken: ContinuationToken;
      }>
    ) {
      const { justificationIds, continuationToken } = action.payload;
      state.isFetchingJustifications = false;
      state.justificationIds = justificationIds.filter(
        (id1) => !state.justificationIds.some((id2) => id1 === id2)
      );
      state.justificationsContinuationToken = continuationToken;
    },
    fetchJustificationsFailure(state) {
      state.isFetchingJustifications = false;
    },
    fetchAppearances(
      state,
      _action: PayloadAction<{
        mediaExcerptId: EntityId;
        continuationToken?: ContinuationToken;
      }>
    ) {
      state.isFetchingAppearances = true;
    },
    fetchAppearancesSuccess(
      state,
      action: PayloadAction<{
        appearanceIds: EntityId[];
        continuationToken: ContinuationToken;
      }>
    ) {
      const { appearanceIds, continuationToken } = action.payload;
      state.isFetchingAppearances = false;
      state.appearanceIds = appearanceIds.filter(
        (id1) => !state.appearanceIds.some((id2) => id1 === id2)
      );
      state.appearancesContinuationToken = continuationToken;
    },
    fetchAppearancesFailure(state) {
      state.isFetchingAppearances = false;
    },
  },
});

export default slice.actions;
export const mediaExcerptUsagesPage = slice.reducer;

const fetchCount = 10;

type FetchJustificationsResponseAction = ReturnType<
  typeof api.fetchJustificationsSearch.response
>;

type FetchAppearancesResponseAction = ReturnType<
  typeof api.fetchAppearances.response
>;

export function* mediaExcerptUsagesPageSaga() {
  yield all([
    mediaExcerptUsagesPageJustificationsSaga(),
    mediaExcerptUsagesPageAppearancesSaga(),
  ]);
}

export function* mediaExcerptUsagesPageJustificationsSaga() {
  yield takeEvery(
    slice.actions.fetchJustifications,
    // TODO(525) factor out the duplicate logic in these sagas. Use it in factCheckPageSliceSaga too.
    function* ({ payload: { mediaExcerptId, continuationToken } }) {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(
        api.fetchJustificationsSearch({
          filters: { mediaExcerptId },
          count: fetchCount,
          continuationToken,
        })
      );
      const {
        responseAction,
        timeout,
      }: { responseAction: FetchJustificationsResponseAction; timeout: true } =
        yield race({
          responseAction: call(
            getResponseAction,
            requestId,
            api.fetchJustificationsSearch.response
          ),
          timeout: delay(config.apiTimeoutMs),
        });
      if (responseAction) {
        if (!responseAction.error) {
          const { result } = normalize(
            responseAction.payload,
            responseAction.meta.normalizationSchema
          );
          const justificationIds = result.justifications;
          const continuationToken = responseAction.payload.continuationToken;

          yield put(
            slice.actions.fetchJustificationsSuccess({
              justificationIds,
              continuationToken,
            })
          );
        } else {
          yield put(slice.actions.fetchJustificationsFailure());
        }
      } else if (timeout) {
        yield put(slice.actions.fetchJustificationsFailure());
      } else {
        yield put(slice.actions.fetchJustificationsFailure());
      }
    }
  );
}
export function* mediaExcerptUsagesPageAppearancesSaga() {
  yield takeEvery(
    slice.actions.fetchAppearances,
    function* ({ payload: { mediaExcerptId, continuationToken } }) {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(
        api.fetchAppearances({ mediaExcerptId }, fetchCount, continuationToken)
      );
      const {
        responseAction,
        timeout,
      }: { responseAction: FetchAppearancesResponseAction; timeout: true } =
        yield race({
          responseAction: call(
            getResponseAction,
            requestId,
            api.fetchAppearances.response
          ),
          timeout: delay(config.apiTimeoutMs),
        });
      if (responseAction) {
        if (!responseAction.error) {
          const { result } = normalize(
            responseAction.payload,
            responseAction.meta.normalizationSchema
          );
          const appearanceIds = result.appearances;
          const continuationToken = responseAction.payload.continuationToken;

          yield put(
            slice.actions.fetchAppearancesSuccess({
              appearanceIds,
              continuationToken,
            })
          );
        } else {
          yield put(slice.actions.fetchAppearancesFailure());
        }
      } else if (timeout) {
        yield put(slice.actions.fetchAppearancesFailure());
      } else {
        yield put(slice.actions.fetchAppearancesFailure());
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
