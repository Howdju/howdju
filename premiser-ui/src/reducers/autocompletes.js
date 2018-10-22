import {handleActions, combineActions} from "redux-actions"
import {api, autocompletes} from "../actions"

export default handleActions({
  [combineActions(
    api.fetchPropositionTextSuggestions.response,
    api.fetchTagNameSuggestions.response,
    api.fetchWritTitleSuggestions.response,
  )]: {
    next: (state, action) => ({
      ...state,
      suggestions: {
        ...state.suggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload.result,
      }
    })
  },
  [api.fetchMainSearchSuggestions.response]: {
    next: (state, action) => ({
      ...state,
      suggestions: {
        ...state.suggestions,
        [action.meta.requestPayload.suggestionsKey]: action.payload.result.propositionTexts,
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