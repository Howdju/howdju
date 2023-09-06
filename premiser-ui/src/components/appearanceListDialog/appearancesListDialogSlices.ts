import { ActionCreator, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, delay, put, race, take, takeEvery } from "typed-redux-saga";
import { normalize } from "normalizr";
import { LOCATION_CHANGE } from "connected-react-router";

import { EntityId } from "howdju-common";

import config from "@/config";
import { ApiResponseActionMeta, ApiActionCreator } from "@/apiActions";

const initialState = {
  isDialogVisible: false,
  isFetching: false,
  appearanceIds: [] as EntityId[],
  fetchError: undefined as string | undefined,
};
export type DialogState = typeof initialState;

export function createAppearancesDialogListSlice(
  /** The name for the slice. */
  name: string
) {
  return createSlice({
    name,
    initialState,
    reducers: {
      showDialog: (state, _action: PayloadAction<EntityId>) => {
        state.isDialogVisible = true;
        state.fetchError = undefined;
        state.isFetching = true;
      },
      hideDialog: (state) => {
        state.isDialogVisible = false;
      },
      fetchAppearancesSuccess: (
        state,
        { payload: appearanceIds }: PayloadAction<EntityId[]>
      ) => {
        state.appearanceIds = appearanceIds;
        state.fetchError = undefined;
        state.isFetching = false;
      },
      fetchAppearancesFailure: (state) => {
        state.fetchError = "Error fetching appearances";
        state.isFetching = false;
      },
    },
    extraReducers(builder) {
      builder.addCase(LOCATION_CHANGE, (state) => {
        // If the user navigates, hide the dialog.
        // I.e. if the user clicks on an appearance link in the dialog, hide the dialog.
        state.isDialogVisible = false;
      });
    },
  });
}

export function createAppearancesDialogListSaga<
  Slice extends ReturnType<typeof createAppearancesDialogListSlice>
>(
  slice: Slice,
  /** An action creator accepting the payload of the showDialog action and returning an action
   * fetching the Appearances  */
  fetchAppearancesActionCreator: ApiActionCreator<
    [ReturnType<Slice["actions"]["showDialog"]>["payload"]],
    any,
    any
  >
) {
  return function* appearancesDialogSaga() {
    yield takeEvery(
      slice.actions.showDialog,
      // TODO(525) factor out the duplicate logic in these sagas.
      function* ({ payload }) {
        const {
          payload: {
            fetchInit: { requestId },
          },
        } = yield put(fetchAppearancesActionCreator(payload));
        const {
          responseAction,
          timeout,
        }: {
          responseAction: ReturnType<
            typeof fetchAppearancesActionCreator.response
          >;
          timeout: true;
        } = yield race({
          responseAction: call(
            getResponseAction,
            requestId,
            fetchAppearancesActionCreator.response
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

            yield put(slice.actions.fetchAppearancesSuccess(appearanceIds));
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
  };
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
