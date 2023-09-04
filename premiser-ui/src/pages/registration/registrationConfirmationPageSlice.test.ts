import { describe, expect, test } from "@jest/globals";

import { registrationConfirmationPage } from "./registrationConfirmationPageSlice";
import { api } from "@/apiActions";

describe("registrationConfirmationPageSlice", () => {
  test("should obtain email from checkRegistration", () => {
    const initialState = {
      email: undefined,
      didCheckRegistration: false,
      registrationErrorCode: undefined,
    };
    const email = "you@domain.com";
    const action = api.checkRegistration.response({ email });
    const newState = registrationConfirmationPage(initialState, action);
    expect(newState.email).toEqual(email);
  });
  test("should obtain email from confirmRegistration", () => {
    const initialState = {
      email: undefined,
      didCheckRegistration: false,
      registrationErrorCode: undefined,
    };
    const email = "you@domain.com";
    const action = api.confirmRegistration.response({ email });
    const newState = registrationConfirmationPage(initialState, action);
    expect(newState.email).toEqual(email);
  });
});
