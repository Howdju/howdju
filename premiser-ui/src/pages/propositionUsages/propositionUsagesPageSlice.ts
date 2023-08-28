import { api } from "@/apiActions";
import { createSlice } from "@reduxjs/toolkit";
import { ContinuationToken } from "howdju-common";
import { normalize } from "normalizr";

export const propositionUsagesPageSlice = createSlice({
  name: "propositionUsagesPage",
  initialState: {
    isFetchingDirect: false,
    isFetchingIndirect: false,
    isFetchingJustifications: false,
    isFetchingAppearances: false,
    isFetchingPropositionCompounds: false,
    directStatements: [],
    indirectStatements: [],
    justifications: [],
    justificationsContinuationToken: undefined as ContinuationToken | undefined,
    appearanceIds: [],
    propositionCompoundIds: [],
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchSentenceStatements, (state) => {
      state.isFetchingDirect = true;
      state.directStatements = [];
    });
    builder.addCase(api.fetchSentenceStatements.response, (state, action) => {
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      state.isFetchingDirect = false;
      state.directStatements = result.statements;
    });
    builder.addCase(api.fetchIndirectPropositionStatements, (state) => {
      state.isFetchingIndirect = true;
      state.indirectStatements = [];
    });
    builder.addCase(
      api.fetchIndirectPropositionStatements.response,
      (state, action) => {
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        state.isFetchingIndirect = false;
        state.indirectStatements = result.statements;
      }
    );
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
      state.justifications = result.justifications;
      state.justificationsContinuationToken = action.payload.continuationToken;
    });
    builder.addCase(api.fetchPropositionAppearances, (state) => {
      state.isFetchingAppearances = true;
    });
    builder.addCase(
      api.fetchPropositionAppearances.response,
      (state, action) => {
        state.isFetchingAppearances = false;
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        state.appearanceIds = result.appearances;
      }
    );
    builder.addCase(api.fetchPropositionCompounds, (state) => {
      state.isFetchingPropositionCompounds = true;
    });
    builder.addCase(api.fetchPropositionCompounds.response, (state, action) => {
      state.isFetchingPropositionCompounds = false;
      const { result } = normalize(
        action.payload,
        action.meta.normalizationSchema
      );
      state.propositionCompoundIds = result.propositionCompounds;
    });
  },
});

export default propositionUsagesPageSlice.actions;
export const propositionUsagesPage = propositionUsagesPageSlice.reducer;
