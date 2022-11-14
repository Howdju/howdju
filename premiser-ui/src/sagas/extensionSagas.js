import { delay, takeEvery } from "redux-saga/effects";

import { actions, inIframe } from "howdju-client-common";
import { logger } from "../logger";

import config from "../config";

// const EXTENSION_ID = 'amnnpakeakkebmgkgjjenjkbkhkgkadh'

let contentScriptHasAcked = false;

export function* postExtensionMessages() {
  const extensionActionCreators = [
    actions.extension.highlightTarget,
    actions.extension.messageHandlerReady,
  ];
  yield takeEvery(
    extensionActionCreators,
    function* postExtensionMessagesWorker(action) {
      if (!inIframe()) {
        throw new Error(
          "should not call extension action when we are not in an extension iframe."
        );
      }
      logger.trace(
        `difficult postExtensionMessagesWorker ${JSON.stringify({ action })}`
      );
      // The extension's content script could be on any page, so allow any target origin ('*')
      window.parent.postMessage(action, "*");
      // For some reason the content script doesn't always see the first message
      while (!contentScriptHasAcked) {
        yield delay(config.contentScriptAckDelayMs);
        window.parent.postMessage(action, "*");
      }
    }
  );
}

export function* contentScriptAck() {
  yield takeEvery(
    actions.extensionFrame.ackMessage,
    function* ackMessageWorker(action) {
      logger.trace(`difficult ackMessageWorker ${JSON.stringify({ action })}`);
      contentScriptHasAcked = true;
    }
  );
}
