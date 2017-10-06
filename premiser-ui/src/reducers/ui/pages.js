import {handleActions} from "redux-actions"
import union from 'lodash/union'

import {
  api,
  ui
} from '../../actions'

export const statementJustificationsPage = handleActions({
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
    statementTexts: [],
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
    }
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
}
export const justificationsSearchPage = handleActions({
  [api.fetchJustificationsSearch]: (state, action) => ({...state, isFetching: true}),
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
