import { ActionCreator } from "redux";
import { createAction } from "@reduxjs/toolkit";

import {
  CreateWritQuoteInput,
  decircularizeJustification,
  JustificationOut,
  PersistedJustificationWithRootRef,
  UrlOut,
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

/** Actions the iframed web app sends to the content script. */
export const extension = {
  highlightTarget: createAction(
    "EXTENSION/HIGHLIGHT_TARGET",
    (justification: JustificationOut, url: UrlOut) => ({
      payload: {
        justification: decircularizeJustification(
          justification
        ) as PersistedJustificationWithRootRef,
        url,
      },
    })
  ),
  messageHandlerReady: createAction("EXTENSION/MESSAGE_HANDLER_READY"),
} as const;

export type ExtensionAction = ReturnType<
  typeof extension[keyof typeof extension]
>;

/** Actions the content script sends to the iframed web app. */
export const extensionFrame = {
  createJustification: createAction(
    "EXTENSION_FRAME/CREATE_JUSTIFICATION",
    (writQuote: CreateWritQuoteInput) => ({
      payload: {
        writQuote,
      },
    })
  ),
  gotoJustification: createAction(
    "EXTENSION_FRAME/GOTO_JUSTIFICATION",
    (justification: PersistedJustificationWithRootRef) => ({
      payload: { justification },
    })
  ),
  ackMessage: createAction("EXTENSION_FRAME/ACK_MESSAGE"),
} as const;
