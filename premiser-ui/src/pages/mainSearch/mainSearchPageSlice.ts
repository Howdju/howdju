import { normalize } from "normalizr";
import { createSlice } from "@reduxjs/toolkit";

import { EntityId } from "howdju-common";

import { api } from "@/apiActions";

export const mainSearchPageSlice = createSlice({
  name: "mainSearchPage",
  initialState: {
    isFetching: false,
    normalizedResult: {
      mediaExcerpts: [] as EntityId[],
      persorgs: [] as EntityId[],
      propositions: [] as EntityId[],
      sources: [] as EntityId[],
      tags: [] as EntityId[],
      writQuoteQuoteTexts: [] as EntityId[],
      writQuoteUrls: [] as EntityId[],
      writTitles: [] as EntityId[],
    },
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchMainSearchResults, (state) => {
      state.isFetching = true;
    });
    builder.addCase(api.fetchMainSearchResults.response, (state, action) => {
      state.isFetching = false;
      if (!action.error) {
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        state.normalizedResult = result;
      }
    });
  },
});

export const mainSearchPage = mainSearchPageSlice.reducer;
export default mainSearchPageSlice.actions;
