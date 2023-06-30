import { isObject } from "lodash";

import { toJson } from "howdju-common";
import {
  actions,
  IframedAppMessage,
  isIframedAppMessage,
  PayloadOf,
} from "howdju-client-common";

import {
  getOrCreateSessionStorageId,
  clearSessionStorageId,
} from "./identifiers";
import { flows, goto } from "./actions";
import { logger } from "./logger";

/** Dispatch-bound action creators needed by WindowMessageHandler. */
export interface WindowMessageHandlerActionCreators {
  beginEditOfMediaExcerptFromAnchorInfo: typeof flows.beginEditOfMediaExcerptFromInfo;
  gotoJustification: typeof goto.justification;
  extensionFrameAckMessage: typeof actions.extensionFrame.ackMessage;
}

export interface TrackingConsentWindowMessage {
  howdjuTrackingConsent: { enabled: boolean };
}

type WindowMessage = IframedAppMessage | TrackingConsentWindowMessage;

export default class WindowMessageHandler {
  actionCreators: WindowMessageHandlerActionCreators;
  constructor(actionCreators: WindowMessageHandlerActionCreators) {
    this.actionCreators = actionCreators;
  }

  handleEvent(event: MessageEvent<WindowMessage | "undefined">) {
    if (!isObject(event.data)) {
      // For reasons I don't understand, on mobile Safari, only in prod (`https`-only?) the
      // event.data is sometimes the string "undefined".
      logger.warn(`MessageEvent.data was not an object: ${toJson(event.data)}`);
      return;
    }
    if (event.source === window) {
      if ("howdjuTrackingConsent" in event.data) {
        const { enabled } = event.data.howdjuTrackingConsent;
        if (enabled) {
          getOrCreateSessionStorageId();
        } else {
          clearSessionStorageId();
        }
        return;
      }
    }

    // Howdju would be loaded in an iframe of the content script's window when loaded by the extension
    if (event.source !== window.parent) {
      logger.debug(
        `Window event not from window or window.parent: ${toJson(event)}`
      );
      return;
    }
    if (!isIframedAppMessage(event)) {
      // E.g. source "react-devtools-bridge"
      logger.debug(
        `Window message from parent must be an Iframed app message ${toJson(
          event
        )}`
      );
      return;
    }
    const action = event.data.action;
    if (!action) {
      logger.error(`extension message lacked action ${toJson(event.data)}`);
      return;
    }
    this.handleAction(event.origin, action);
  }

  private handleAction(
    eventOrigin: string,
    action: actions.ExtensionFrameAction
  ) {
    const type = action.type;
    switch (type) {
      case `${actions.extensionFrame.beginEditOfMediaExcerptFromAnchorInfo}`: {
        const payload = action.payload as PayloadOf<
          typeof actions.extensionFrame.beginEditOfMediaExcerptFromAnchorInfo
        >;
        if (!payload.url.startsWith(eventOrigin)) {
          logger.error(
            `received message from origin ${eventOrigin} to createJustification with anchors in url: ${payload.url}.` +
              " The browser extension should only create justifications matching the origin. Ignoring."
          );
          return;
        }
        this.actionCreators.beginEditOfMediaExcerptFromAnchorInfo(payload);
        break;
      }
      case `${actions.extensionFrame.gotoJustification}`: {
        logger.trace(`extensionFrame.gotoJustification`, { action });
        const { justification } = action.payload as PayloadOf<
          typeof actions.extensionFrame.gotoJustification
        >;
        this.actionCreators.gotoJustification(justification);
        break;
      }
      case `${actions.extensionFrame.ackMessage}`: {
        this.actionCreators.extensionFrameAckMessage();
        break;
      }
      default: {
        logger.error(`unsupported message action type: ${type}`);
        break;
      }
    }
  }
}
