import { ActionCreator, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { call, delay, put, race, take, takeEvery } from "typed-redux-saga";
import { normalize } from "normalizr";
import { LOCATION_CHANGE } from "connected-react-router";

import { EntityId, PropositionOut } from "howdju-common";

import config from "@/config";
import { RootState } from "@/setupStore";
import { api, ApiResponseActionMeta } from "@/apiActions";

const initialState = {
  isDialogVisible: false,
  appearanceIds: [] as EntityId[],
  fetchError: undefined as string | undefined,
};

const slice = createSlice({
  name: "PropositionAppearancesDialog",
  initialState,
  reducers: {
    showDialog: (state, _action: PayloadAction<PropositionOut>) => {
      state.isDialogVisible = true;
      state.fetchError = undefined;
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
    },
    fetchAppearancesFailure: (state) => {
      state.fetchError = "Error fetching appearances";
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

export default slice.actions;
export const propositionAppearancesDialog = slice.reducer;

export const selectIsDialogVisible = (state: RootState) =>
  state.propositionAppearancesDialog.isDialogVisible;

export function* propositionAppearancesDialogSaga() {
  yield takeEvery(
    slice.actions.showDialog,
    // TODO(525) factor out the duplicate logic in these sagas.
    function* ({ payload: { id: propositionId } }) {
      const {
        payload: {
          fetchInit: { requestId },
        },
      } = yield put(api.fetchPropositionAppearances(propositionId));
      const {
        responseAction,
        timeout,
      }: {
        responseAction: ReturnType<
          typeof api.fetchPropositionAppearances.response
        >;
        timeout: true;
      } = yield race({
        responseAction: call(
          getResponseAction,
          requestId,
          api.fetchPropositionAppearances.response
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
