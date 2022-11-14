import { combineReducers } from "redux";

import {
  passwordResetConfirmationPage,
  passwordResetRequestPage,
} from "./pages";
import transients from "./transients";

export default combineReducers({
  passwordResetConfirmationPage,
  passwordResetRequestPage,
  transients,
});
