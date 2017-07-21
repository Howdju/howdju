import { combineReducers } from 'redux'
import {LOCATION_CHANGE} from 'react-router-redux'
import {handleActions} from "redux-actions";
import map from 'lodash/map'
import union from 'lodash/union'

import {
  api,
  ui
} from '../actions'
import mainSearcher from '../mainSearcher'

const statementJustificationsPage = handleActions({
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

export const appUi = handleActions({
  [ui.showNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: true}),
  [ui.hideNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: false}),
  [ui.toggleNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: !state.isNavDrawerVisible}),
  [ui.setNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: action.payload.visible}),
  [ui.addToast]: (state, action) => ({...state, toasts: state.toasts.concat(action.payload)}),
  [ui.dismissToast]: (state, action) => ({...state, toasts: state.toasts.slice(1)}),
}, {
  isNavDrawerVisible: false,
  toasts: []
})

export const mainSearch = handleActions({
  [ui.mainSearchTextChange]: (state, action) => ({...state, mainSearchText: action.payload}),
  [LOCATION_CHANGE]: (state, action) => {
    if (!mainSearcher.isSearch(action.payload)) {
      return {...state, mainSearchText: ''}
    }
    return state
  },
}, {
  mainSearchText: '',
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

export const justificationsPage = handleActions({
  [api.fetchJustifications.response]: {
    next: (state, action) => {
      return {
        ...state,
        justifications: action.payload.result.justifications,
        continuationToken: action.payload.result.continuationToken,
      }
    }
  }
}, {
  justifications: [],
  continuationToken: null,
})

export default combineReducers({
  statementJustificationsPage,
  mainSearchPage,
  app: appUi,
  mainSearch,
  featuredPerspectivesPage,
  justificationsPage,
})
