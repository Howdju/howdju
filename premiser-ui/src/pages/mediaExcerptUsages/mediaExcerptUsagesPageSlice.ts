import { api } from "@/apiActions";
import { createSlice } from "@reduxjs/toolkit";
import { normalize } from "normalizr";
import { concat } from "lodash";

import { ContinuationToken, JustificationOut } from "howdju-common";

export const mediaExcerptUsagesPageSlice = createSlice({
  name: "mediaExcerptUsagesPage",
  initialState: {
    isFetchingJustifications: false,
    justifications: [] as JustificationOut[],
    justificationsContinuationToken: undefined as ContinuationToken | undefined,
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchJustificationsSearch, (state) => {
      state.isFetchingJustifications = true;
    });
    builder.addCase(api.fetchJustificationsSearch.response, (state, action) => {
      state.isFetchingJustifications = false;
      if (action.error) {
        return;
      }
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      const newJustifications = result.justifications.filter(
        (j: JustificationOut) =>
          !state.justifications.some((j2) => j2.id === j.id)
      );
      state.justifications = concat(state.justifications, newJustifications);
      state.justificationsContinuationToken = action.payload.continuationToken;
      state.isFetchingJustifications = false;
    });
  },
});

export default mediaExcerptUsagesPageSlice.actions;
export const mediaExcerptUsagesPage = mediaExcerptUsagesPageSlice.reducer;
