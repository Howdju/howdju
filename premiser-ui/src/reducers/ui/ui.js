import { combineReducers } from 'redux'
import {LOCATION_CHANGE} from 'connected-react-router'
import {handleActions} from "redux-actions"
import merge from 'lodash/merge'

import {
  ui
} from '../../actions'
import mainSearcher from '../../mainSearcher'
import {
  accountSettingsPage,
  featuredPerspectivesPage,
  justificationsPage,
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

const defaultReportContentDialogState = {
  isReportDialogVisible: false,
  entity: {},
  form: {
    checkedByCode: {},
    description: '',
  },
}
export const reportContentDialog = handleActions({
  [ui.showReportContentDialog]: (state, action) =>
    ({...state, isReportDialogVisible: true, entity: action.payload}),
  [ui.hideReportContentDialog]: (state) =>
    ({...state, ...defaultReportContentDialogState}),
  [ui.editReportContentDialogForm]: (state, action) =>
    ({...state, form: {
      ...state.form,
      ...action.payload,
      checkedByCode: {...state.form.checkedByCode, ...action.payload.checkedByCode},
    }}),
}, defaultReportContentDialogState)

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
  justificationsPage,
  justificationsSearchPage,
  mainSearch,
  mainSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  reportContentDialog,
  tagPage,
  transients,
})
