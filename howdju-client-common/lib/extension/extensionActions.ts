import { createAction } from "@reduxjs/toolkit";

import {
  MediaExcerptInfo,
  decircularizeJustification,
  PersistedJustificationWithRootRef,
  UrlOut,
  JustificationView,
  UrlLocator,
  MediaExcerptView,
} from "howdju-common";

/** Actions the iframed web app sends to the content script. */
export const extension = {
  highlightTarget: createAction(
    "EXTENSION/HIGHLIGHT_TARGET",
    (justification: JustificationView, url: UrlOut) => ({
      payload: {
        justification: decircularizeJustification(
          justification
        ) as PersistedJustificationWithRootRef,
        url,
      },
    })
  ),
  highlightUrlLocator: createAction(
    "EXTENSION/HIGHLIGHT_URL_LOCATOR",
    (mediaExcerpt: MediaExcerptView, urlLocator: UrlLocator) => ({
      payload: { mediaExcerpt, urlLocator },
    })
  ),
  messageHandlerReady: createAction("EXTENSION/MESSAGE_HANDLER_READY"),
} as const;

export type ExtensionAction = ReturnType<
  typeof extension[keyof typeof extension]
>;

/** Actions the content script sends to the iframed web app. */
export const extensionFrame = {
  beginEditOfMediaExcerptFromInfo: createAction(
    "EXTENSION_FRAME/BEGIN_EDIT_OF_MEDIA_EXCERPT_FROM_INFO",
    (mediaExcerptInfo: MediaExcerptInfo) => ({
      payload: mediaExcerptInfo,
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

export type ExtensionFrameActionName = keyof typeof extensionFrame;
export type ExtensionFrameActionCreator =
  typeof extensionFrame[ExtensionFrameActionName];
/** An extensionFrame action. */
export type ExtensionFrameAction = ReturnType<
  typeof extensionFrame[keyof typeof extensionFrame]
>;
