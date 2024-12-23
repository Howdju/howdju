import { createReducer } from "@reduxjs/toolkit";
import { Moment } from "moment";

import { AuthToken } from "howdju-common";

import { matchActions } from "../reducers/matchActions";
import { api } from "../api/apiActions";

export type AuthState = {
  authToken: AuthToken | undefined;
  authTokenExpiration: Moment | undefined;
};

const initialState: AuthState = {
  authToken: undefined as AuthToken | undefined,
  authTokenExpiration: undefined as Moment | undefined,
};

export const authReducer = createReducer(initialState, (builder) => {
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
