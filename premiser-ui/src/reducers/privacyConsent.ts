import { Cookie, CookieId } from "@/cookieConsent";
import { PayloadAction } from "@reduxjs/toolkit";
import forEach from "lodash/forEach";
import { handleActions } from "redux-actions";
import { privacyConsent, str } from "../actions";

const defaultState: Partial<Record<CookieId, Cookie>> = {};
export default handleActions(
  {
    [str(privacyConsent.update)]: (
      state,
      action: PayloadAction<{ cookies: Cookie[] }>
    ) => {
      const { cookies } = action.payload;
      // Index the cookie objects by their ID for easier access.
      const privacyConsent: Partial<Record<CookieId, Cookie>> = {};
      forEach(cookies, (cookie) => {
        privacyConsent[cookie.id] = cookie;
      });
      return { ...state, ...privacyConsent };
    },
  },
  defaultState
);
