import { api } from "@/apiActions";
import { isApiResponseError } from "@/uiErrors";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntityId } from "aws-sdk/clients/machinelearning";
import { HttpStatusCode } from "axios";
import { JustificationRootTargetType } from "howdju-common";

export const justificationsPageSlice = createSlice({
  name: "justificationsPage",
  initialState: {
    isNewJustificationDialogVisible: false,
    isFetching: false,
    isInvalidContextTrail: false,
  },
  reducers: {
    showNewJustificationDialog: (state) => {
      state.isNewJustificationDialogVisible = true;
    },
    hideNewJustificationDialog: (state) => {
      state.isNewJustificationDialogVisible = false;
    },
    fetchRootJustificationTarget: (
      state,
      _action: PayloadAction<{
        rootTargetType: JustificationRootTargetType;
        rootTargetId: EntityId;
      }>
    ) => {
      state.isFetching = true;
    },
    fetchRootJustificationTargetResponse: (state) => {
      state.isFetching = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(api.fetchContextTrail.response, (state, action) => {
      state.isInvalidContextTrail = isApiResponseError(action.error)
        ? action.error.httpStatusCode === HttpStatusCode.Conflict
        : false;
    });
  },
});

export default justificationsPageSlice.actions;
export const justificationsPage = justificationsPageSlice.reducer;
