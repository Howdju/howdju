import { createSlice } from "@reduxjs/toolkit";

import { api } from "@/apiActions";

const initialState = {
  isAddUrlLocatorsDialogVisible: false,
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
