import { denormalize, schema, Schema } from "normalizr";
import moment from "moment";

import { EntityId, UserExternalIds } from "howdju-common";

import { EditorType } from "./reducers/editors";
import { RootState } from "./setupStore";
import { EditorId } from "./types";

export const selectEditorState =
  (editorType: EditorType, editorId: EditorId) => (state: RootState) =>
    state.editors?.[editorType]?.[editorId];
export const selectJustificationSearchFilters = (state: RootState) =>
  state.justificationsSearchPage.filters;
export const selectLoginRedirectLocation = (state: RootState) =>
  state.app.loginRedirectLocation;
export const selectUserExternalIds = (
  state: RootState,
  defaultValue: Partial<UserExternalIds>
) => state.currentUser.details?.externalIds || defaultValue;
export const selectIsWindowNarrow = (state: RootState) =>
  state.app.isWindowNarrow;
export const selectAuthRefreshTokenExpiration = (state: RootState) =>
  moment.utc(state.currentUser.authRefreshTokenExpiration);
export const selectUser = (state: RootState) => state.currentUser.details;
export const selectAuthEmail = (state: RootState) =>
  state.currentUser.details?.email;
export const selectDidCheckRegistration = (state: RootState) =>
  state.registrationConfirmationPage.didCheckRegistration;
export const selectRegistrationEmail = (state: RootState) =>
  state.registrationConfirmationPage.email;
export const selectRegistrationErrorCode = (state: RootState) =>
  state.registrationConfirmationPage.registrationErrorCode;
export const selectPrivacyConsent = (state: RootState) => state.privacyConsent;

export type InferResult<S> = S extends schema.Entity<any>
  ? EntityId
  : S extends schema.Array<any>
  ? EntityId[]
  : S extends object
  ? { [K in keyof S]: InferResult<S[K]> }
  : never;
export type Denormalized<S> = S extends schema.Entity<infer U>
  ? U | undefined
  : S extends schema.Array<infer U>
  ? U[]
  : S extends object
  ? { [K in keyof S]: Denormalized<S[K]> }
  : never;
export const denormalizedEntity = <S extends Schema>(
  state: RootState,
  result: InferResult<S>,
  schema: S
) => denormalize(result, schema, state.entities) as Denormalized<S>;
