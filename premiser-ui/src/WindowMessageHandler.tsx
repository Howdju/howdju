import { logger } from "./logger";

import { actions, IframedAppMessage, PayloadOf } from "howdju-client-common";

import {
  getOrCreateSessionStorageId,
  clearSessionStorageId,
} from "./identifiers";
import { flows, goto } from "./actions";
import { toJson } from "howdju-common";
import { every } from "lodash";

/** Dispatch-bound action creators needed by WindowMessageHandler. */
export interface WindowMessageHandlerActionCreators {
  beginEditOfNewJustificationFromWritQuote: typeof flows.beginEditOfNewJustificationFromWritQuote;
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

  handleEvent(event: MessageEvent<WindowMessage>) {
    if ("howdjuTrackingConsent" in event.data) {
      if (event.source !== window) {
        logger.error("howdjuTrackingConsent must have source === window.");
        return;
      }
      const { enabled } = event.data.howdjuTrackingConsent;
      if (enabled) {
        getOrCreateSessionStorageId();
      } else {
        clearSessionStorageId();
      }
      return;
    }

    // Howdju would be loaded in an iframe of the content script's window when loaded by the extension
    if (event.source !== window.parent) {
      return;
    }
    const source = event.data.source;
    if (source !== "extension") {
      logger.debug(`ignoring message event with incorrect source: ${source}`);
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
      case `${actions.extensionFrame.createJustification}`: {
        const { writQuote } = action.payload as PayloadOf<
          typeof actions.extensionFrame.createJustification
        >;
        if (!every(writQuote.urls, (u) => u.url.startsWith(eventOrigin))) {
          const urls = writQuote.urls.map((u) => u.url).join(", ");
          logger.error(
            `received message from origin ${eventOrigin} to createJustification including urls: ${toJson(
              urls
            )}.` +
              " The browser extension should only create justifications matching the origin. Ignoring."
          );
          return;
        }
        this.actionCreators.beginEditOfNewJustificationFromWritQuote(writQuote);
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
