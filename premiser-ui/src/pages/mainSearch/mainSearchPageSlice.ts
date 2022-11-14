import { api } from "@/apiActions"
import { createSlice } from "@reduxjs/toolkit"
import { normalize } from "normalizr"

export const mainSearchPageSlice = createSlice({
  name: "mainSearchPage",
  initialState: {
    isFetching: false,
    results: {
      tags: [],
      propositionTexts: [],
      writQuoteQuoteTexts: [],
      writQuoteUrls: [],
      writTitles: [],
    },
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchMainSearchResults, (state) => {
      state.isFetching = true
    })
    builder.addCase(api.fetchMainSearchResults.response, (state, action) => {
      state.isFetching = false
      if (!action.error) {
        const {result} = normalize(action.payload, action.meta.normalizationSchema)
        state.results = result
      }
    })
  },
})

export const mainSearchPage = mainSearchPageSlice.reducer
export default mainSearchPageSlice.actions
