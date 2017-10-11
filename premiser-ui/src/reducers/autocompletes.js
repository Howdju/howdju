import {handleActions, combineActions} from "redux-actions"
import {api, autocompletes} from "../actions"

export default handleActions({

  [combineActions(
    api.fetchStatementTextSuggestions.response,
    api.fetchTagNameSuggestions.response,
    api.fetchWritTitleSuggestions.response,
    api.fetchMainSearchSuggestions.response,
  )]: {
    next: (state, action) => ({
      ...state,
      suggestions: {
        ...state.suggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload.result,
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