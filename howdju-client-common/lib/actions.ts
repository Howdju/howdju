import { ActionCreator } from "redux";
import { createAction } from "redux-actions";
import {
  CounteredJustification,
  decircularizeJustification,
  Justification,
  Url,
  WritQuote,
} from "howdju-common";

/** react-actions has a convention that its action creators .toString return the action type.
 * .toString appears to happen automatically when an action creator is the key of an object, but in some
 * cases we will need to call .toString manually.  This method will help us locate those places in the code
 */
export const str = (ac: ActionCreator<unknown>) => ac.toString();

// Actions to send to the extension
export const extension = {
  highlightTarget: createAction(
    "EXTENSION/HIGHLIGHT_TARGET",
    (
      justification: CounteredJustification,
      writQuote: WritQuote,
      url: Url
    ) => ({
      justification: decircularizeJustification(justification),
      writQuote,
      url,
    })
  ),
  messageHandlerReady: createAction("EXTENSION/MESSAGE_HANDLER_READY"),
};

// Actions to send to the frame the extension inserts that is hosting the web app
export const extensionFrame = {
  createJustification: createAction("EXTENSION_FRAME/CREATE_JUSTIFICATION"),
  gotoJustification: createAction(
    "EXTENSION_FRAME/GOTO_JUSTIFICATION",
    (justification: Justification) => ({ justification })
  ),
  ackMessage: createAction("EXTENSION_FRAME/ACK_MESSAGE"),
};
