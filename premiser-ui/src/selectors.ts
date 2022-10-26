import get from 'lodash/get'
import { EditorType } from './reducers/editors'
import { RootState } from './store'
import { EditorId } from './types'

export const selectEditorState = (editorType: EditorType, editorId: EditorId) => (state: RootState) => get(state.editors, [editorType, editorId])
export const selectJustificationSearchFilters = (state: RootState) => state.justificationsSearchPage.filters
export const selectLoginRedirectLocation = (state: RootState) => state.app.loginRedirectLocation
export const selectUserExternalIds = (state: RootState, defaultValue: object) => get(state, ['auth', 'user', 'externalIds'], defaultValue)
export const selectLoggedErrors = (state: RootState) => state.errors.loggedErrors
export const selectIsWindowNarrow = (state: RootState) => get(state, ['ui', 'app', 'isWindowNarrow'])
export const selectCanHover = (state: RootState) => get(state, ['ui', 'app', 'canHover'])
export const selectAuthToken = (state: RootState) => get(state, ['auth', 'authToken'])
export const selectAuthTokenExpiration = (state: RootState) => get(state, ['auth', 'authTokenExpiration'])
export const selectUser = (state: RootState) => get(state, ['auth', 'user'])
export const selectAuthEmail = (state: RootState) => get(state, ['auth', 'user', 'email'])
export const selectDidCheckRegistration = (state: RootState) => get(state, 'ui.registrationConfirmationPage.didCheckRegistration')
export const selectRegistrationEmail = (state: RootState) => get(state, 'ui.registrationConfirmationPage.email')
export const selectRegistrationErrorCode = (state: RootState) => get(state, 'ui.registrationConfirmationPage.registrationErrorCode')
export const selectPasswordResetRequestPage = (state: RootState) => get(state, 'ui.passwordResetRequestPage')
export const selectPasswordResetConfirmationPage = (state: RootState) => get(state, 'ui.passwordResetConfirmationPage')
export const selectPrivacyConsent = (state: RootState) => get(state, ['privacyConsent'])
