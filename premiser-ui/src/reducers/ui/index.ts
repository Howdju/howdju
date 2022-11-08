import { combineReducers } from 'redux'

import {
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  registrationConfirmationPage,
} from './pages'
import transients from './transients'

export default combineReducers({
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  registrationConfirmationPage,
  transients,
})
