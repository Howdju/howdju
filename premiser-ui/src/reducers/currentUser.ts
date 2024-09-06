import { matchActions } from "@/reducerUtils";
import { createReducer } from "@reduxjs/toolkit";
import { Moment } from "moment";

import { User } from "howdju-common";
import { api } from "howdju-client-common";

const initialState = {
  details: undefined as User | undefined,
  authRefreshTokenExpiration: undefined as Moment | undefined,
};

export default createReducer(initialState, (builder) => {
  builder.addCase(api.logout.response, (state, action) => {
    if (action.error) {
      return state;
    }
    return initialState;
  });
  builder.addCase(api.refreshAuth.response, (state, action) => {
    if (action.error) {
      // See handling of ReauthenticationRequiredError in router.ts
      // TODO(#113) type error payloads correctly
      const payload = action.payload as unknown as {
        body: { authRefreshTokenExpiration: Moment };
      };

      return {
        ...state,
        authRefreshTokenExpiration: payload.body.authRefreshTokenExpiration,
      };
    }
    const { user: details, authRefreshTokenExpiration } = action.payload;
    return { ...state, details, authRefreshTokenExpiration };
  });
  builder.addMatcher(
    matchActions(
      api.login.response,
      api.confirmRegistration.response,
      api.confirmPasswordReset.response
    ),
    (state, action) => {
      if (action.error) {
        return state;
      }
      const {
        user: details,
        authRefreshTokenExpiration: authRefreshTokenExpiration,
      } = action.payload;
      return { ...state, details, authRefreshTokenExpiration };
    }
  );
});
