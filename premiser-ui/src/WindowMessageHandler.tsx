import { logger } from "./logger";

import { EXTENSION_MESSAGE_SOURCE, actions } from "howdju-client-common";

import {
  getOrCreateSessionStorageId,
  clearSessionStorageId,
} from "./identifiers";
import { flows, goto } from "./actions";
import { toJson } from "howdju-common";

/** Dispatch-bound action creators needed by WindowMessageHandler. */
export interface WindowMessageHandlerActionCreators {
  beginEditOfNewJustificationFromTarget: typeof flows.beginEditOfNewJustificationFromTarget;
  gotoJustification: typeof goto.justification;
  extensionFrameAckMessage: typeof actions.extensionFrame.ackMessage;
}

export type HandleActionPayload = ReturnType<
  | typeof actions.extensionFrame.createJustification
  | typeof actions.extensionFrame.gotoJustification
  | typeof actions.extensionFrame.ackMessage
>;

export default class WindowMessageHandler {
  actionCreators: WindowMessageHandlerActionCreators;
  constructor(actionCreators: WindowMessageHandlerActionCreators) {
    this.actionCreators = actionCreators;
  }

  handleEvent(event: MessageEvent) {
    if (event.source === window) {
      if (event.data.howdjuTrackingConsent) {
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
      return;
    }
    const source = event.data.source;
    if (source !== EXTENSION_MESSAGE_SOURCE) {
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

  private handleAction(eventOrigin: string, action: HandleActionPayload) {
    const type = action.type;
    const str = actions.str;
    switch (type) {
      case str(actions.extensionFrame.createJustification): {
        const { content, source, target } = action.payload;
        if (!target.url.startsWith(eventOrigin)) {
          logger.error(
            `received message from ${eventOrigin} to createJustification of ${target.url}.` +
              " The browser extension should only create justifications matching the current origin.  Ignoring."
          );
          return;
        }
        if (source.url !== target.url) {
          logger.error(
            `received createJustification message where source.url ${source.url} doesn't match` +
              ` target.url ${target.url}.  Ignoring`
          );
          return;
        }
        this.actionCreators.beginEditOfNewJustificationFromTarget(
          content,
          source,
          target
        );
        break;
      }
      case str(actions.extensionFrame.gotoJustification): {
        logger.trace(`extensionFrame.gotoJustification`, { action });
        const { justification } = action.payload;
        this.actionCreators.gotoJustification(justification);
        break;
      }
      case str(actions.extensionFrame.ackMessage): {
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
