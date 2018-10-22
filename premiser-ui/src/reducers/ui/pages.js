import {handleActions} from "redux-actions"
import union from 'lodash/union'

import {
  api,
  ui
} from '../../actions'

export const propositionJustificationsPage = handleActions({
  [ui.showNewJustificationDialog]: (state, action) => ({
    ...state,
    isNewJustificationDialogVisible: true,
  }),
  [ui.hideNewJustificationDialog]: (state, action) => ({
    ...state,
    isNewJustificationDialogVisible: false
  }),
}, {
  isNewJustificationDialogVisible: false,
})

export const mainSearchPage = handleActions({
  [api.fetchMainSearchResults]: (state, action) => ({...state, isFetching: true}),
  [api.fetchMainSearchResults.response]: {
    next: (state, action) => {
      return {...state, isFetching: false, results: action.payload.result}
    },
    throw: (state, action) => ({...state, isFetching: false})
  }
}, {
  isFetching: false,
  results: {
    tags: [],
    propositionTexts: [],
    writQuoteQuoteTexts: [],
    writQuoteUrls: [],
    writTitles: [],
  }
})

export const featuredPerspectivesPage = handleActions({
  [api.fetchFeaturedPerspectives]: state => ({...state, isFetching: true}),
  [api.fetchFeaturedPerspectives.response]: {
    next: (state, action) => {
      return {
        ...state,
        featuredPerspectives: union(state.featuredPerspectives, action.payload.result.perspectives),
        continuationToken: action.payload.result.continuationToken,
        isFetching: false
      }
    },
    throw: (state, action) => ({...state, isFetching: false})
  },
}, {
  featuredPerspectives: [],
  continuationToken: null,
  isFetching: false,
})

const defaultJustificationSearchPageState = {
  justifications: [],
  continuationToken: null,
  isFetching: false,
  filters: null,
}
export const justificationsSearchPage = handleActions({
  [api.fetchJustificationsSearch]: (state, action) => ({
    ...state,
    isFetching: true,
    filters: action.payload.filters
  }),
  [api.fetchJustificationsSearch.response]: {
    next: (state, action) => {
      return {
        ...state,
        justifications: action.payload.result.justifications,
        continuationToken: action.payload.result.continuationToken,
        isFetching: false,
      }
    },
    throw: (state, action) => ({...state, isFetching: true}),
  },
  [ui.clearJustificationsSearch]: (state, action) => ({...state, ...defaultJustificationSearchPageState})
}, defaultJustificationSearchPageState)

const defaultTagPageState = {
  propositions: [],
  isFetching: false,
  tagId: null,
}
export const tagPage = handleActions({
  [api.fetchTaggedPropositions]: (state, action) => ({
    ...state,
    isFetching: true,
    tagId: action.payload.tagId,
  }),
  [api.fetchTaggedPropositions.response]: {
    next: (state, action) => ({
      ...state,
      propositions: action.payload.result.propositions,
      isFetching: false
    }),
    throw: (state, action) => ({
      ...state,
      propositions: [],
      isFetching: false
    }),
  },
  [ui.clearTaggedPropositions]: (state, action) => ({
    ...state,
    ...defaultTagPageState
  }),
}, defaultTagPageState)
