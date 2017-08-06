import {handleActions, combineActions} from "redux-actions";
import map from 'lodash/map'
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
  [api.fetchStatementsSearch]: (state, action) => ({...state, isFetching: true}),
  [api.fetchStatementsSearch.response]: {
    next: (state, action) => {
      const statements = map(action.payload.result, id => action.payload.entities.statements[id])
      return {...state, isFetching: false, statements: statements || []}
    },
    throw: (state, action) => ({...state, isFetching: false})
  }
}, {
  isFetching: false,
  statements: []
})

export const featuredPerspectivesPage = handleActions({
  [api.fetchFeaturedPerspectives.response]: {
    next: (state, action) => {
      return {
        ...state,
        featuredPerspectives: union(state.featuredPerspectives, action.payload.result.perspectives),
        continuationToken: action.payload.result.continuationToken
      }
    }
  },
}, {
  featuredPerspectives: [],
  continuationToken: null,
})

const defaultJustificationSearchPageState = {
  justifications: [],
  continuationToken: null,
  isFetching: false,
}
export const justificationsSearchPage = handleActions({
  [combineActions(
      api.fetchJustificationsSearch,
      api.fetchMoreJustificationsSearch,
  )]: (state, action) => ({...state, isFetching: true}),
  [combineActions(
      api.fetchJustificationsSearch.response,
      api.fetchMoreJustificationsSearch.response,
  )]: {
    next: (state, action) => {
      return {
        ...state,
        justifications: action.payload.result.justifications,
        continuationToken: action.payload.result.continuationToken,
        isFetching: false,
      }
    },
    throw: (state, action) => ({...state, ...defaultJustificationSearchPageState})
  },
  [ui.clearJustificationsSearch]: (state, action) => ({...state, ...defaultJustificationSearchPageState})
}, defaultJustificationSearchPageState)