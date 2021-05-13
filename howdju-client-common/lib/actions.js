import { createAction as actionCreator } from 'redux-actions'

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = ac => ac.toString()

export const extension = {
  focusJustificationOnUrl: actionCreator('EXTENSION/FOCUS_JUSTIFICATION_ON_URL',
    (url, justificationId, howdjuUrl) => ({url, justificationId, howdjuUrl}))
}

export const extensionFrame = {
  createJustification: actionCreator('EXTENSION_FRAME/CREATE_JUSTIFICATION')
}
