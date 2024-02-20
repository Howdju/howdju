import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, delay, put, race, take, takeEvery } from "typed-redux-saga";

import { EntityId } from "howdju-common";

import { api } from "@/apiActions";
import config from "@/config";

const initialState = {
  isFetching: false,
  appearanceIds: [] as EntityId[],
};

export const slice = createSlice({
  name: "factCheckPage",
  initialState,
  reducers: {
    fetchFactCheck: (
      state,
      _action: PayloadAction<{
        userIds: EntityId[];
        urlIds: EntityId[];
        sourceIds: EntityId[];
      }>
    ) => {
      state.isFetching = true;
      state.appearanceIds = [];
    },
    fetchFactCheckSuccess: (
      state,
      {
        payload: { appearanceIds },
      }: PayloadAction<{ appearanceIds: EntityId[] }>
    ) => {
      state.isFetching = false;
      state.appearanceIds = appearanceIds;
    },
    fetchFactCheckFailure: (state) => {
      state.isFetching = false;
    },
  },
});

export default slice.actions;
export const factCheckPage = slice.reducer;

export function* factCheckPageSaga() {
  yield takeEvery(
    slice.actions.fetchFactCheck,
    // TODO(#525) factor out the duplicate logic in these sagas.
    function* ({ payload: { userIds, urlIds, sourceIds } }) {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(api.fetchFactCheck(userIds, urlIds, sourceIds));
      const {
        responseAction,
        timeout,
      }: { responseAction: FetchFactCheckResponseAction; timeout: true } =
        yield race({
          responseAction: call(getResponseAction, requestId),
          timeout: delay(config.apiTimeoutMs),
        });
      if (responseAction) {
        if (!responseAction.error) {
          const appearanceIds = responseAction.payload.appearances.map(
            (a) => a.id
          );
          yield put(slice.actions.fetchFactCheckSuccess({ appearanceIds }));
        } else {
          yield put(slice.actions.fetchFactCheckFailure());
        }
      } else if (timeout) {
        yield put(slice.actions.fetchFactCheckFailure());
      } else {
        yield put(slice.actions.fetchFactCheckFailure());
      }
    }
  );
}

type FetchFactCheckResponseAction = ReturnType<
  typeof api.fetchFactCheck.response
>;

function* getResponseAction(requestId: string) {
  while (true) {
    const resultAction: FetchFactCheckResponseAction = yield take(
      api.fetchFactCheck.response
    );
    if (resultAction.meta.requestId === requestId) {
      return resultAction;
    }
  }
}
