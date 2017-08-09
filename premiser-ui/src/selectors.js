import get from 'lodash/get'

export const selectEditorState = (editorType, editorId) => state => get(state.editors, [editorType, editorId])
export const selectRouterLocation = state => state.router.location
export const selectLoginRedirectLocation = state => state.app.loginRedirectLocation
export const selectUserExternalIds = (state, defaultValue) => get(state, ['auth', 'user', 'externalIds'], defaultValue)
export const selectAuthToken = state => state.auth.authToken
export const selectLoggedErrors = state => state.errors.loggedErrors