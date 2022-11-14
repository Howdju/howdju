import { api } from "@/actions";
import { createSlice } from "@reduxjs/toolkit";

export const justificationsPageSlice = createSlice({
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
  },
  extraReducers(builder) {
    builder.addCase(api.fetchRootJustificationTarget, (state) => {
      state.isFetching = true;
    });
    builder.addCase(api.fetchRootJustificationTarget.response, (state) => {
      state.isFetching = false;
    });
  },
});

export default justificationsPageSlice.actions;
export const justificationsPage = justificationsPageSlice.reducer;
