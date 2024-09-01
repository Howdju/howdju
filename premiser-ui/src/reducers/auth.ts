import { matchActions } from "@/reducerUtils";
import { createReducer } from "@reduxjs/toolkit";
import { Moment } from "moment";

import { AuthToken } from "howdju-common";

import { api } from "../actions";

const initialState = {
  authToken: undefined as AuthToken | undefined,
  authTokenExpiration: undefined as Moment | undefined,
};

export default createReducer(initialState, (builder) => {
  builder.addCase(api.logout.response, (state, action) => {
    if (action.error) {
      return state;
    }
    return initialState;
  });
  builder.addMatcher(
    matchActions(
      api.login.response,
      api.confirmRegistration.response,
      api.confirmPasswordReset.response,
      api.refreshAuth.response
    ),
    (state, action) => {
      if (action.error) {
        return {
          ...initialState,
          authRefreshTokenExpiration: action.payload.authRefreshTokenExpiration,
        };
      }
      const { authToken, authTokenExpiration } = action.payload;
      return {
        ...state,
        authToken,
        authTokenExpiration,
      };
    }
  );
});
