import { createAction as actionCreator } from 'redux-actions'
import {decircularizeJustification} from "howdju-common"

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = ac => ac.toString()

// Actions to send to the extension
export const extension = {
  highlightTarget: actionCreator('EXTENSION/HIGHLIGHT_TARGET',
    (justification, writQuote, url) => ({
      justification: decircularizeJustification(justification),
      writQuote,
      url})),
  messageHandlerReady: actionCreator('EXTENSION/MESSAGE_HANDLER_READY'),
}

// Actions to send to the frame the extension inserts that is hosting the web app
export const extensionFrame = {
  createJustification: actionCreator('EXTENSION_FRAME/CREATE_JUSTIFICATION'),
  gotoJustification: actionCreator('EXTENSION_FRAME/GOTO_JUSTIFICATION',
    (justification) => ({justification})),
  ackMessage: actionCreator('EXTENSION_FRAME/ACK_MESSAGE'),
}
