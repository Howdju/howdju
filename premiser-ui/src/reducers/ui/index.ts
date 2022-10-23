import { combineReducers } from 'redux'

import {
  accountSettingsPage,
  featuredPerspectivesPage,
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
  featuredPerspectivesPage,
  justificationsSearchPage,
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  persorgPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  tagPage,
  transients,
})
