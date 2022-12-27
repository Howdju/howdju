import get from "lodash/get";
import { EditorState, EditorType } from "./reducers/editors";
import { RootState } from "./setupStore";
import { EditorId } from "./types";

export const selectEditorState =
  (editorType: EditorType, editorId: EditorId) =>
  (state: RootState): EditorState<any> =>
    get(state.editors, [editorType, editorId]);
export const selectJustificationSearchFilters = (state: RootState) =>
  state.justificationsSearchPage.filters;
export const selectLoginRedirectLocation = (state: RootState) =>
  state.app.loginRedirectLocation;
export const selectUserExternalIds = (state: RootState, defaultValue: object) =>
  state.auth.user?.externalIds || defaultValue;
export const selectLoggedErrors = (state: RootState) =>
  state.errors.loggedErrors;
export const selectIsWindowNarrow = (state: RootState) =>
  state.app.isWindowNarrow;
export const selectCanHover = (state: RootState) => state.app.canHover;
export const selectAuthToken = (state: RootState) => state.auth.authToken;
export const selectAuthTokenExpiration = (state: RootState) =>
  state.auth.authTokenExpiration;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthEmail = (state: RootState) => state.auth.user?.email;
export const selectDidCheckRegistration = (state: RootState) =>
  state.registrationConfirmationPage.didCheckRegistration;
export const selectRegistrationEmail = (state: RootState) =>
  state.registrationConfirmationPage.email;
export const selectRegistrationErrorCode = (state: RootState) =>
  state.registrationConfirmationPage.registrationErrorCode;
export const selectPasswordResetRequestPage = (state: RootState) =>
  state.ui.passwordResetRequestPage;
export const selectPasswordResetConfirmationPage = (state: RootState) =>
  state.ui.passwordResetConfirmationPage;
export const selectPrivacyConsent = (state: RootState) => state.privacyConsent;
