import { createSlice } from "@reduxjs/toolkit";
import { normalize } from "normalizr";

import { ContinuationToken, EntityId } from "howdju-common";

import { api } from "@/apiActions";

const initialState = {
  mediaExcerptIds: [] as EntityId[],
  isFetchingMediaExcerpts: false,
  mediaExcerptsContinuationToken: undefined as ContinuationToken | undefined,
};

export const sourcePageSlice = createSlice({
  name: "sourcePage",
  initialState,
  reducers: {
    clearMediaExcerpts: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchSourceMediaExcerpts, (state) => {
      state.isFetchingMediaExcerpts = true;
    });
    builder.addCase(api.fetchSourceMediaExcerpts.response, (state, action) => {
      state.isFetchingMediaExcerpts = false;
      if (action.error) {
        state.mediaExcerptIds = [];
        state.mediaExcerptsContinuationToken = undefined;
        return;
      }
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      const newMediaExcerptIds = result.mediaExcerpts.filter(
        (id1: EntityId) =>
          !state.mediaExcerptIds.find((id2: EntityId) => id1 === id2)
      );
      state.mediaExcerptIds = state.mediaExcerptIds.concat(newMediaExcerptIds);
      state.mediaExcerptsContinuationToken = action.payload.continuationToken;
    });
  },
});

export default sourcePageSlice.actions;
export const sourcePage = sourcePageSlice.reducer;
