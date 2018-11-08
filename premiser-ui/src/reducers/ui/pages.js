import union from 'lodash/union'
import {normalize} from 'normalizr'
import {handleActions} from "redux-actions"

import {
  api,
  ui
} from '../../actions'

export const justificationsPage = handleActions({
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
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {...state, isFetching: false, results: result}
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
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        featuredPerspectives: union(state.featuredPerspectives, result.perspectives),
        continuationToken: action.payload.continuationToken,
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
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        justifications: result.justifications,
        continuationToken: action.payload.continuationToken,
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
    next: (state, action) => {
      const {result} = normalize(action.payload, action.meta.normalizationSchema)
      return {
        ...state,
        propositions: result.propositions,
        isFetching: false
      }
    },
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
