import forEach from "lodash/forEach";
import { handleActions } from "redux-actions";
import { privacyConsent } from "../actions";

const defaultState = {};
export default handleActions(
  {
    [privacyConsent.update]: (state, action) => {
      const { cookies } = action.payload;
      // Index the cookie objects by their ID for easier access.
      const privacyConsent = {};
      forEach(cookies, (cookie) => {
        privacyConsent[cookie.id] = cookie;
      });
      return { ...state, ...privacyConsent };
    },
  },
  defaultState
);
