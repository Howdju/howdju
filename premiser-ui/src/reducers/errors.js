import { errors } from "../actions";
import { handleActions } from "redux-actions";

export default handleActions(
  {
    [errors.logError]: (state, action) => {
      const error = action.payload.error;
      if (state.loggedErrors.indexOf(error) > -1) {
        return state;
      }
      return { ...state, loggedErrors: state.loggedErrors.concat([error]) };
    },
    [errors.clearLoggedErrors]: (state) => {
      return { ...state, loggedErrors: [] };
    },
  },
  { loggedErrors: [] }
);
