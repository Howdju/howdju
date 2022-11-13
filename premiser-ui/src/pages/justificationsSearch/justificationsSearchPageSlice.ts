import { api } from "@/apiActions"
import { createSlice } from "@reduxjs/toolkit"
import { JustificationSearchFilters } from "howdju-common"
import { normalize } from "normalizr"


const initialState = {
  justifications: [],
  continuationToken: null as string | null,
  isFetching: false,
  filters: null as JustificationSearchFilters | null,
}

export const justificationsSearchPageSlice = createSlice({
  name: "justificationsSearchPage",
  initialState,
  reducers: {
    clearSearch: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchJustificationsSearch, (state, action) => {
      state.isFetching = true
      state.filters = action.payload.filters
    })
    builder.addCase(api.fetchJustificationsSearch.response, (state, action) => {
      state.isFetching = false
      if (action.error) {
        return
      }
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      state.justifications = state.justifications.concat(result.justifications)
      state.continuationToken = action.payload.continuationToken
    })
  },
})

export default justificationsSearchPageSlice.actions
export const justificationsSearchPage = justificationsSearchPageSlice.reducer
