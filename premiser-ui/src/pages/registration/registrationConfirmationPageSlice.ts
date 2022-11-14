import { createSlice } from "@reduxjs/toolkit";
import { ApiErrorCode } from "howdju-common";

import { api } from "@/apiActions";

export const registrationConfirmationPageSlice = createSlice({
  name: "registrationConfirmationPage",
  initialState: {
    email: null as string | null,
    didCheckRegistration: false,
    // TODO(26) not used in RegistrationConfirmationPage.tsx
    registrationErrorCode: null as ApiErrorCode | null,
  },
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(
      (action) =>
        api.checkRegistration.response.match(action) ||
        api.confirmRegistration.response.match(action),
      (state, action) => {
        state.didCheckRegistration = true;
        if (action.error) {
          state.registrationErrorCode = action.payload.body.errorCode;
          return;
        }
        state.email = action.payload.email;
        state.registrationErrorCode = null;
      }
    );
  },
});

export default registrationConfirmationPageSlice.actions;
export const registrationConfirmationPage =
  registrationConfirmationPageSlice.reducer;
