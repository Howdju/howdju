import {normalize} from 'normalizr'
import {handleActions, combineActions} from "redux-actions"
import {api, autocompletes} from "../actions"

export default handleActions({
  [combineActions(
    api.fetchPersorgNameSuggestions.response,
    api.fetchPropositionTextSuggestions.response,
    api.fetchTagNameSuggestions.response,
    api.fetchWritTitleSuggestions.response,
  )]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        suggestions: {
          ...state.suggestions,
          [action.meta.requestPayload.suggestionsKey]: result,
        }
      }
    }
  },
  [api.fetchMainSearchSuggestions.response]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        suggestions: {
          ...state.suggestions,
          [action.meta.requestPayload.suggestionsKey]: result.propositionTexts,
        }
      }
    }
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