import produce from "immer";
import { normalize } from "normalizr";
import { handleActions } from "redux-actions";

import {
  api,
  ApiResponseActionMeta,
  SuggestionsKey,
  combineActions,
  str,
} from "howdju-client-common";

import { autocompletes } from "../actions";

const initialState = {
  suggestions: {} as Record<SuggestionsKey, any[]>,
};

export default handleActions<
  typeof initialState,
  any,
  ApiResponseActionMeta<any, any>
>(
  {
    [combineActions(
      api.fetchPersorgNameSuggestions.response,
      api.fetchPropositionTextSuggestions.response,
      api.fetchTagNameSuggestions.response,
      api.fetchWritTitleSuggestions.response,
      api.fetchSourceDescriptionSuggestions.response
    )]: {
      next: (state, action) => {
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        return {
          ...state,
          suggestions: {
            ...state.suggestions,
            [action.meta.requestMeta.suggestionsKey]:
              result[action.meta.requestMeta.suggestionsResponseKey],
          },
        };
      },
    },
    [str(api.fetchMainSearchSuggestions.response)]: {
      next: (state, action) => {
        const { result } = normalize(
          action.payload,
          action.meta.normalizationSchema
        );
        return {
          ...state,
          suggestions: {
            ...state.suggestions,
            [action.meta.requestMeta.suggestionsKey]: result.propositions,
          },
        };
      },
    },
    [str(autocompletes.clearSuggestions)]: produce((state, action) => {
      state.suggestions[action.payload.suggestionsKey] = [];
    }),
  },
  initialState
);
