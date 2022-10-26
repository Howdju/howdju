import { combineReducers } from 'redux'

import {
  accountSettingsPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
} from './pages'
import transients from './transients'

export default combineReducers({
  accountSettingsPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  transients,
})
