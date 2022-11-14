import { api } from "@/apiActions"
import { getLocationPathParam } from "@/routes"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { LocationChangeAction, LOCATION_CHANGE } from "connected-react-router"
import { EntityId } from "howdju-common"
import { normalize } from "normalizr"

const initialState = {
  propositions: [],
  isFetching: false,
  tagId: null as EntityId | null,
}

export const tagPageSlice = createSlice({
  name: "tagPage",
  initialState,
  reducers: {
    clearTaggedPropositions: () => initialState,
  },
  extraReducers(builder) {
    builder.addCase(api.fetchTaggedPropositions, (state, action: PayloadAction<{tagId: EntityId}>) => {
      state.isFetching = true
      state.tagId = action.payload.tagId
    }),
    builder.addCase(api.fetchTaggedPropositions.response, (state, action) => {
      state.isFetching = false
      if (action.error) {
        state.propositions = []
        return
      }
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      state.propositions = result.propositions
    })
    builder.addCase(LOCATION_CHANGE, (state, action: LocationChangeAction) => {
      // Reset the state if the path tag ID changes.
      const tagId = getLocationPathParam("tag", 'tagId', action.payload.location)
      if (!tagId || tagId !== state.tagId) {
        return
      }
      return initialState
    })
  },
})

export default tagPageSlice.actions
export const tagPage = tagPageSlice.reducer
