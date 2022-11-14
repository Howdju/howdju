import { api } from "@/apiActions";
import { createSlice } from "@reduxjs/toolkit";
import { normalize } from "normalizr";

const initialState = {
  statements: [],
  isFetching: false,
};

export const persorgPageSlice = createSlice({
  name: "persorgPage",
  initialState,
  reducers: {
    clearPersorgStatements: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchSpeakerStatements, (state) => {
      state.isFetching = true;
    }),
      builder.addCase(api.fetchSpeakerStatements.response, (state, action) => {
        state.isFetching = false;
        if (action.error) {
          state.statements = [];
          return;
        }
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        state.statements = state.statements.concat(result.statements);
      });
  },
});

export default persorgPageSlice.actions;
export const persorgPage = persorgPageSlice.reducer;
