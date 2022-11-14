import {normalize} from 'normalizr'
import {handleActions} from "redux-actions"
import {autocompletes, combineActions, str} from "../actions"
import {api, ApiActionMeta} from "../apiActions"

const initialState = {
  suggestions: {},
}

export default handleActions<typeof initialState, any, ApiActionMeta>({
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
        },
      }
    },
  },
  [str(api.fetchMainSearchSuggestions.response)]: {
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        suggestions: {
          ...state.suggestions,
          [action.meta.requestPayload.suggestionsKey]: result.propositionTexts,
        },
      }
    },
  },
  [str(autocompletes.clearSuggestions)]: (state, action) => ({
    ...state,
    suggestions: {
      ...state.suggestions,
      [action.payload.suggestionsKey]: [],
    },
  }),
}, initialState)
