import { combineReducers } from 'redux'

import {
  accountSettingsPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  propositionUsagesPage,
  registrationConfirmationPage,
} from './pages'
import transients from './transients'

export default combineReducers({
  accountSettingsPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  transients,
})
