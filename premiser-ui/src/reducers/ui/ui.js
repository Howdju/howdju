import { combineReducers } from 'redux'
import {LOCATION_CHANGE} from 'react-router-redux'
import {handleActions} from "redux-actions"

import {
  ui
} from '../../actions'
import mainSearcher from '../../mainSearcher'
import {
  statementJustificationsPage,
  mainSearchPage,
  featuredPerspectivesPage,
  justificationsSearchPage,
} from './pages'
import transients from './transients'

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

export default combineReducers({
  statementJustificationsPage,
  mainSearchPage,
  app: appUi,
  mainSearch,
  featuredPerspectivesPage,
  justificationsSearchPage,
  transients,
})