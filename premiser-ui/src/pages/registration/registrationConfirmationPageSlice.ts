import { createSlice } from "@reduxjs/toolkit";

import { ApiErrorCode } from "howdju-common";
import { api } from "howdju-client-common";

import { matchActions } from "@/reducerUtils";

export const registrationConfirmationPageSlice = createSlice({
  name: "registrationConfirmationPage",
  initialState: {
    email: undefined as string | undefined,
    didCheckRegistration: false,
    // TODO(26) not used in RegistrationConfirmationPage.tsx
    registrationErrorCode: undefined as ApiErrorCode | undefined,
  },
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(
      matchActions(
        api.checkRegistration.response,
        api.confirmRegistration.response
      ),
      (state, action) => {
        state.didCheckRegistration = true;
        if (action.error) {
          state.registrationErrorCode = action.payload.body.errorCode;
          return;
        }
        state.email = action.payload.email;
        state.registrationErrorCode = undefined;
      }
    );
  },
});

export default registrationConfirmationPageSlice.actions;
export const registrationConfirmationPage =
  registrationConfirmationPageSlice.reducer;
