import get from 'lodash/get'

export const selectEditorState = (editorType, editorId) => state => get(state.editors, [editorType, editorId])
export const selectJustificationSearchFilters = (state) => state.ui.justificationsSearchPage.filters
export const selectTagPageTagId = (state) => state.ui.tagPage.tagId
export const selectLoginRedirectLocation = (state) => state.app.loginRedirectLocation
export const selectUserExternalIds = (state, defaultValue) => get(state, ['auth', 'user', 'externalIds'], defaultValue)
export const selectLoggedErrors = (state) => state.errors.loggedErrors
export const selectIsWindowNarrow = (state) => get(state, ['ui', 'app', 'isWindowNarrow'])
export const selectCanHover = (state) => get(state, ['ui', 'app', 'canHover'])
export const selectAuthToken = (state) => get(state, ['auth', 'authToken'])
export const selectAuthTokenExpiration = (state) => get(state, ['auth', 'authTokenExpiration'])
export const selectUser = (state) => get(state, ['auth', 'user'])
export const selectAuthEmail = (state) => get(state, ['auth', 'user', 'email'])
export const selectDidCheckRegistration = (state) => get(state, 'ui.registrationConfirmationPage.didCheckRegistration')
export const selectRegistrationEmail = (state) => get(state, 'ui.registrationConfirmationPage.email')
export const selectRegistrationErrorCode = (state) => get(state, 'ui.registrationConfirmationPage.registrationErrorCode')
export const selectPasswordResetRequestPage = (state) => get(state, 'ui.passwordResetRequestPage')
export const selectPasswordResetConfirmationPage = (state) => get(state, 'ui.passwordResetConfirmationPage')
