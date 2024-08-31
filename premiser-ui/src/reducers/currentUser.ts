import { matchActions } from "@/reducerUtils";
import { createReducer } from "@reduxjs/toolkit";
import { Moment } from "moment";

import { User } from "howdju-common";

import { api } from "../actions";

const initialState = {
  details: undefined as User | undefined,
  authRefreshExpiration: undefined as Moment | undefined,
};

export default createReducer(initialState, (builder) => {
  builder.addCase(api.logout.response, () => initialState);
  builder.addCase(api.refreshAuth.response, (state, action) => {
    if (action.error) {
      return initialState;
    }
    return state;
  });
  builder.addMatcher(
    matchActions(
      api.login.response,
      api.confirmRegistration.response,
      api.confirmPasswordReset.response
    ),
    (state, action) => {
      if (action.error) {
        return initialState;
      }
      const {
        user: details,
        authRefreshTokenExpiration: authRefreshExpiration,
      } = action.payload;
      return { ...state, details, authRefreshExpiration };
    }
  );
});
