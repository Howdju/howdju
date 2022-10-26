import { combineReducers } from 'redux'

import {
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  propositionUsagesPage,
  registrationConfirmationPage,
} from './pages'
import transients from './transients'

export default combineReducers({
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  propositionUsagesPage,
  registrationConfirmationPage,
  transients,
})
