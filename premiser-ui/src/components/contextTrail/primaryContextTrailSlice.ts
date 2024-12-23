import { createSlice } from "@reduxjs/toolkit";

import { httpStatusCodes } from "howdju-common";
import { api, isApiResponseError } from "howdju-client-common";

export const primaryContextTrailSlice = createSlice({
  name: "primaryContextTrail",
  initialState: {
    isInvalidContextTrail: false,
  },
  reducers: {},
  extraReducers(builder) {
    // If we add support for multiple context trails on the page we'll need to update this.
    builder.addCase(api.fetchContextTrail.response, (state, action) => {
      // TODO(113) remove typecast after removing redux-actions style reducers
      const error = action.payload as unknown as Error;
      state.isInvalidContextTrail = isApiResponseError(error)
        ? error.httpStatusCode === httpStatusCodes.CONFLICT
        : false;
    });
  },
});

export default primaryContextTrailSlice.actions;
export const primaryContextTrail = primaryContextTrailSlice.reducer;
