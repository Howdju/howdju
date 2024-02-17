import { createSlice } from "@reduxjs/toolkit";

import { api } from "@/apiActions";

const initialState = {
  urlStatesByName: {} as Record<string, ReturnType<typeof defaultUrlState>>,
};

function defaultUrlState() {
  return {
    isFetchingCanonicalUrl: false,
    canonicalUrl: undefined as string | undefined,
  };
}

export const urlLocatorsEditorFieldsSlice = createSlice({
  name: "urlLocatorsEditorFields",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchCanonicalUrl, (state, { meta: { urlKey } }) => {
      if (!(urlKey in state.urlStatesByName)) {
        state.urlStatesByName[urlKey] = defaultUrlState();
      }
      state.urlStatesByName[urlKey].isFetchingCanonicalUrl = true;
    });
    builder.addCase(api.fetchCanonicalUrl.response, (state, action) => {
      const { urlKey } = action.meta.requestMeta;
      state.urlStatesByName[urlKey] = {
        isFetchingCanonicalUrl: false,
        canonicalUrl: action.payload.canonicalUrl,
      };
    });
    builder.addCase(api.createMediaExcerpt.response, (state, action) => {
      if (!action.error) {
        // Assume that any successful media excerpt creation should reset this state.
        return initialState;
      }
      return state;
    });
  },
});

export default urlLocatorsEditorFieldsSlice.actions;
export const urlLocatorsEditorFields = urlLocatorsEditorFieldsSlice.reducer;
