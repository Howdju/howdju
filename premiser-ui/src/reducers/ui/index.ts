import { combineReducers } from 'redux'

import {
  accountSettingsPage,
  justificationsSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
} from './pages'
import transients from './transients'

export default combineReducers({
  accountSettingsPage,
  justificationsSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
  transients,
})
