
import {handleActions} from "redux-actions";
import {api, autocompletes} from "../actions";

export default handleActions({
  [api.fetchStatementTextSuggestions.response]: {
    next: (state, action) => ({
      ...state,
      suggestions: {
        ...state.suggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload,
      }
    })
  },
  [api.fetchMainSearchSuggestions.response]: {
    next: (state, action) => ({
      ...state,
      suggestions: {
        ...state.suggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload,
      }
    })
  },
  [autocompletes.clearSuggestions]: (state, action) => ({
    ...state,
    suggestions: {
      ...state.suggestions,
      [action.payload.suggestionsKey]: [],
    },
  }),
}, {
  suggestions: {}
})