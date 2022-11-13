
import mainSearcher from "../../mainSearcher"
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { LocationChangeAction, LOCATION_CHANGE } from "connected-react-router"

/** The MainSearchBox's slice. */
export const mainSearchSlice = createSlice({
  name: "mainSearch",
  initialState: {
    text: "",
  },
  reducers: {
    textChange(state, action: PayloadAction<string>) {
      state.text = action.payload
    },
  },
  extraReducers(builder) {
    builder.addCase(LOCATION_CHANGE, (state, action: LocationChangeAction) => {
      // If the user navigates away from the search page, clear the search text.
      if (!mainSearcher.isSearch(action.payload.location)) {
        state.text = ""
      }
    })
  },
})

export const mainSearch = mainSearchSlice.reducer
export default mainSearchSlice.actions
