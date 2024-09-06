import { createSlice } from "@reduxjs/toolkit";

import { api } from "howdju-client-common";

const initialState = {
  isAddUrlLocatorsDialogVisible: false,
  isAddCitationsDialogVisible: false,
  isAddSpeakersDialogVisible: false,
  isFetching: false,
};

export const mediaExcerptPageSlice = createSlice({
  name: "mediaExcerptPage",
  initialState,
  reducers: {
    showAddUrlLocatorsDialog(state) {
      state.isAddUrlLocatorsDialogVisible = true;
    },
    hideAddUrlLocatorsDialog(state) {
      state.isAddUrlLocatorsDialogVisible = false;
    },
    showAddCitationsDialog(state) {
      state.isAddCitationsDialogVisible = true;
    },
    hideAddCitationsDialog(state) {
      state.isAddCitationsDialogVisible = false;
    },
    showAddSpeakersDialog(state) {
      state.isAddSpeakersDialogVisible = true;
    },
    hideAddSpeakersDialog(state) {
      state.isAddSpeakersDialogVisible = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(api.fetchMediaExcerpt, (state) => {
      state.isFetching = true;
    });
    builder.addCase(api.fetchMediaExcerpt.response, (state) => {
      state.isFetching = false;
    });
  },
});

export default mediaExcerptPageSlice.actions;
export const mediaExcerptPage = mediaExcerptPageSlice.reducer;
