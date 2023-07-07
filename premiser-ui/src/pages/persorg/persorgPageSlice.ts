import { createSlice } from "@reduxjs/toolkit";
import { normalize } from "normalizr";

import { MediaExcerptOut, StatementOut } from "howdju-common";

import { api } from "@/apiActions";

const initialState = {
  statements: [] as StatementOut[],
  isFetchingStatements: false,
  mediaExcerpts: [] as MediaExcerptOut[],
  isFetchingMediaExcerpts: false,
};

export const persorgPageSlice = createSlice({
  name: "persorgPage",
  initialState,
  reducers: {
    clearPersorgStatements: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchSpeakerStatements, (state) => {
      state.isFetchingStatements = true;
    });
    builder.addCase(api.fetchSpeakerStatements.response, (state, action) => {
      state.isFetchingStatements = false;
      if (action.error) {
        state.statements = [];
        return;
      }
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      const newStatements = result.statements.filter(
        (s1: StatementOut) =>
          !state.statements.find((s2: StatementOut) => s2.id === s1.id)
      );
      state.statements = state.statements.concat(newStatements);
    });

    builder.addCase(api.fetchSpeakerMediaExcerpts, (state) => {
      state.isFetchingMediaExcerpts = true;
    });
    builder.addCase(api.fetchSpeakerMediaExcerpts.response, (state, action) => {
      state.isFetchingMediaExcerpts = false;
      if (action.error) {
        state.mediaExcerpts = [];
        return;
      }
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      const newMediaExcerpts = result.mediaExcerpts.filter(
        (me1: MediaExcerptOut) =>
          !state.mediaExcerpts.find((me2: MediaExcerptOut) => me2.id === me1.id)
      );
      state.mediaExcerpts = state.mediaExcerpts.concat(newMediaExcerpts);
    });
  },
});

export default persorgPageSlice.actions;
export const persorgPage = persorgPageSlice.reducer;
