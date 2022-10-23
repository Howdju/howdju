import { api } from "@/actions";
import { put } from "redux-saga/effects";
import { createSlice } from "saga-slice";
import { RootTargetInfo } from "@/viewModels";
import { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  isNewJustificationDialogVisible: false,
  isFetching: false,
};
export type JustificationPageState = typeof initialState

export const justificationsPage = createSlice({
  name: "justificationsPage",
  initialState: {
    isNewJustificationDialogVisible: false,
    isFetching: false,
  },
  reducers: {
    showNewJustificationDialog: (state) => {
      state.isNewJustificationDialogVisible = true;
    },
    hideNewJustificationDialog: (state) => {
      state.isNewJustificationDialogVisible = false;
    },
    fetchRootJustificationTarget: (state, _action: PayloadAction<RootTargetInfo>) => {
      state.isFetching = true
    },
  },
  extraReducers(builder) {
    builder.addCase(api.fetchRootJustificationTarget.response, (state) => {
      state.isFetching = false
    })
  },
  sagas: (A) => ({
    *[A.fetchRootJustificationTarget](action: PayloadAction<RootTargetInfo>) {
      const {rootTargetType, rootTargetId} = action.payload
        yield put(api.fetchRootJustificationTarget(rootTargetType, rootTargetId));
    },
  }),
});

export const actions = justificationsPage.actions
