import { api } from "@/apiActions";
import { createSlice } from "@reduxjs/toolkit";
import { MediaExcerptSearchFilter } from "howdju-common";
import { normalize } from "normalizr";

const initialState = {
  mediaExcerpts: [],
  continuationToken: undefined as string | undefined,
  isFetching: false,
  filters: undefined as MediaExcerptSearchFilter | undefined,
};

export const mediaExcerptsSearchPageSlice = createSlice({
  name: "mediaExcerptsSearchPage",
  initialState,
  reducers: {
    clearSearch: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchMediaExcerpts, (state, action) => {
      state.isFetching = true;
      state.filters = action.meta.filters;
    });
    builder.addCase(api.fetchMediaExcerpts.response, (state, action) => {
      state.isFetching = false;
      if (action.error) {
        return;
      }
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      state.mediaExcerpts = state.mediaExcerpts.concat(result.mediaExcerpts);
      state.continuationToken = action.payload.continuationToken;
    });
  },
});

export default mediaExcerptsSearchPageSlice.actions;
export const mediaExcerptsSearchPage = mediaExcerptsSearchPageSlice.reducer;
