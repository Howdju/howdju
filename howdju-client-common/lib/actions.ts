import { ActionCreator } from "redux";
import { createAction } from "redux-actions";
import {
  CounteredJustification,
  decircularizeJustification,
  Justification,
  Url,
  WritQuote,
} from "howdju-common";

/**
 * redux-actions and @reduxjs/toolkit have a convention that action creators get a .toString method
 * that returns the action type. The call to .toString appears to happen automatically when an
 * action creator is the key of an object, but:
 *
 * 1) TypeScript doesn't recognize action creators as valid object keys, and
 * 2) The reducers/sagas keyed in this way cannot receive inferred types.
 *
 * We can use this method to satisfy (1). Because of (2), though, we will probably eventually want
 * to phase out this function.
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
