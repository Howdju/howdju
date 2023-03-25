import { api } from "@/apiActions";
import { isApiResponseError } from "@/uiErrors";
import { createSlice } from "@reduxjs/toolkit";
import { httpStatusCodes } from "howdju-common";

export const primaryContextTrailSlice = createSlice({
  name: "primaryContextTrail",
  initialState: {
    isInvalidContextTrail: false,
  },
  reducers: {},
  extraReducers(builder) {
    // If we add support for multiple context trails on the page we'll need to update this.
    builder.addCase(api.fetchContextTrail.response, (state, action) => {
      state.isInvalidContextTrail = isApiResponseError(action.error)
        ? action.error.httpStatusCode === httpStatusCodes.CONFLICT
        : false;
    });
  },
});

export default primaryContextTrailSlice.actions;
export const primaryContextTrail = primaryContextTrailSlice.reducer;
