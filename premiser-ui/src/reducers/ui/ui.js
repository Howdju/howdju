import { combineReducers } from 'redux'
import {LOCATION_CHANGE} from 'connected-react-router'
import {handleActions} from "redux-actions"

import {
  ui
} from '../../actions'
import mainSearcher from '../../mainSearcher'
import {
  accountSettingsPage,
  featuredPerspectivesPage,
  justificationsSearchPage,
  mainSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
} from './pages'
import transients from './transients'
import {isWindowNarrow} from "../../util"

export const app = handleActions({
  [ui.showNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: true}),
  [ui.hideNavDrawer]: (state, action) => ({...state, isNavDrawerVisible: false}),
  [ui.toggleNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: !state.isNavDrawerVisible}),
  [ui.setNavDrawerVisibility]: (state, action) => ({...state, isNavDrawerVisible: action.payload.visible}),
  [ui.addToast]: (state, action) => ({...state, toasts: state.toasts.concat(action.payload)}),
  [ui.dismissToast]: (state, action) => ({...state, toasts: state.toasts.slice(1)}),
  [ui.windowResize]: state => ({...state, isWindowNarrow: isWindowNarrow()}),
  [ui.setCanHover]: (state, action) => ({...state, canHover: action.payload.canHover}),
  [ui.disableMobileSite]: (state) => ({...state, isMobileSiteDisabled: true}),
  [ui.enableMobileSite]: (state) => ({...state, isMobileSiteDisabled: false}),
}, {
  canHover: false,
  isNavDrawerVisible: false,
  isMobileSiteDisabled: false,
  isWindowNarrow: isWindowNarrow(),
  toasts: [],
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
  app,
  accountSettingsPage,
  featuredPerspectivesPage,
  justificationsSearchPage,
  mainSearch,
  mainSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
  transients,
})
