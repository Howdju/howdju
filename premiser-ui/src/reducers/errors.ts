import { handleActions } from "redux-actions";
import { PayloadAction } from "@reduxjs/toolkit";

import { errors } from "../actions";

const initialState = { loggedErrors: [] as Error[] };

export default handleActions(
  {
    [`${errors.logError}`]: (
      state,
      action: PayloadAction<{ error: Error }>
    ) => {
      const error = action.payload.error;
      if (state.loggedErrors.indexOf(error) > -1) {
        return state;
      }
      return { ...state, loggedErrors: state.loggedErrors.concat([error]) };
    },
    [`${errors.clearLoggedErrors}`]: (state) => {
      return { ...state, loggedErrors: [] };
    },
  },
  initialState
);
