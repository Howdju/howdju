import { combineReducers } from 'redux'

import {
  accountSettingsPage,
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
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
  transients,
})
