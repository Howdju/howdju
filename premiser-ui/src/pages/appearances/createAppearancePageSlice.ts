import { createSlice } from "@reduxjs/toolkit";

import { api } from "@/apiActions";

const initialState = {
  isFetching: false,
};

export const createAppearancePageSlice = createSlice({
  name: "createAppearancePage",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchMediaExcerpt, (state) => {
      state.isFetching = true;
    });
    builder.addCase(api.fetchMediaExcerpt.response, (state) => {
      state.isFetching = false;
    });
  },
});

export default createAppearancePageSlice.actions;
export const createAppearancePage = createAppearancePageSlice.reducer;
