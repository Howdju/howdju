/// <reference path="../../howdju-client-common/lib/dom-anchor-text-position.d.ts" />
/// <reference path="../../howdju-client-common/lib/dom-anchor-text-quote.d.ts" />

// Babel runtime dependencies
import "core-js/stable";
import "regenerator-runtime/runtime";

import find from "lodash/find";
import { forEach } from "lodash";
import { Exact } from "type-fest";

import {
  logger,
  PersistedJustificationWithRootRef,
  UrlOut,
} from "howdju-common";
import {
  extension as ext,
  actions,
  urlEquivalent,
  ExtensionMessage,
  PayloadOf,
  runCommandsWhenTabReloaded,
  ContentScriptCommand,
  getCanonicalUrl,
  getCurrentUrl,
  WindowMessageSource,
} from "howdju-client-common";

import { annotateSelection, annotateTarget } from "./annotate";
import { getFrameApi, showSidebar, toggleSidebar } from "./sidebar";
import { getOption } from "./options";
import { FramePanelApi } from "./framePanel";

const didLoadKey = "HowdjuDidLoad";

const allowedOrigins = [
  "http://localhost:3000",
  "https://pre-prod-www.howdju.com",
  "https://www.howdju.com",
];
type FramePanelApiCallback = (frameApi: FramePanelApi) => void;
let messageHandlerReady = false;
let messageHandlerReadyCallbacks: FramePanelApiCallback[] = [];

if (!window[didLoadKey]) {
  logger.trace(
    `difficult addOnWindowMessageListener, ${window.document.title}`
  );
  ext.addRuntimeOnMessageListener(onRuntimeMessage);
  window.addEventListener("message", onWindowMessage, false);
  window[didLoadKey] = true;
}

function onWindowMessage(event: MessageEvent) {
  const { data, origin } = event;
  if (!find(allowedOrigins, (ao) => ao === origin)) {
    logger.trace(
      `ignoring window message event from disallowed origin '${origin}'`,
      { event }
    );
    return;
  }

  routeWindowMessage(data);
}

function onRuntimeMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    routeRuntimeMessage(message, sender);
  } catch (err) {
    logger.error(err);
  }
  if (sendResponse) sendResponse();
}

function routeWindowMessage(action: actions.ExtensionAction) {
  const { type, payload } = action;
  if (!type) {
    logger.error(`window message lacked an action type: ${action}`);
  }
  let isRecognized = true;
  switch (type) {
    case `${actions.extension.highlightTarget}`:
      highlightTarget(
        payload as PayloadOf<typeof actions.extension.highlightTarget>
      );
      break;
    case `${actions.extension.messageHandlerReady}`:
      setMessageHandlerReady(true);
      break;
    default:
      logger.error(`Unhandled window message: ${action}`);
      isRecognized = false;
      break;
  }
  if (isRecognized) {
    // Let the app know we got it
    postActionMessageToFrame(actions.extensionFrame.ackMessage());
  }
}

function highlightTarget({
  justification,
  url,
}: {
  justification: PersistedJustificationWithRootRef;
  url: UrlOut;
}) {
  const { target } = url;
  // When we reload the page in the callback below, we lose the sidebar.
  // So we ask the background script to call us when we have reloaded,
  // and we both 1) tell the sidebar to load the justification and 2)
  // annotate the target in the new page.
  const commands: ContentScriptCommand[] = [
    {
      postActionMessageToFrame: {
        gotoJustification: [justification],
      },
    },
  ];
  if (target) {
    commands.push({ annotateTarget: [target] });
  }
  if (
    urlEquivalent(url.url, getCanonicalUrl()) ||
    urlEquivalent(url.url, getCurrentUrl())
  ) {
    runCommands(commands);
  } else {
    ext.sendRuntimeMessage(runCommandsWhenTabReloaded(commands), () => {
      window.location.href = url.url;
    });
  }
}

function runCommands(commands: ContentScriptCommand[]) {
  for (const command of commands) {
    try {
      runCommand(command);
    } catch (err) {
      logger.error(`error running command:`, { command, err });
    }
  }
}

function runCommand<T extends Exact<ContentScriptCommand, T>>(command: T) {
  logger.trace(`difficult runCommand ${JSON.stringify({ command })}`);
  if ("postActionMessageToFrame" in command) {
    // TODO(38) remove any typecast
    forEach(command.postActionMessageToFrame, (value: any, key: any) => {
      const actionCreator =
        actions.extensionFrame[key as actions.ExtensionFrameActionName];
      if (!actionCreator) {
        logger.error(`Unrecognized extensionFrame action: ${key}`);
        return;
      }
      logger.trace(
        `difficult postActionMessageToFrame ${JSON.stringify({
          key,
          value,
        })}`
      );
      postActionMessageToFrame(actionCreator(...(value as [any])));
    });
    return;
  }
  if ("annotateTarget" in command) {
    // TODO(38) remove any typecast
    const annotation = annotateTarget(...(command.annotateTarget as [any]));
    annotation.nodes[0].scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
    return;
  }
  logger.error(`Unrecognized command ${command}`);
}

function routeRuntimeMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
) {
  logger.debug("routeMessage:", { message, sender });
  switch (message.type) {
    case "ANNOTATE_SELECTION":
      annotateSelectionAndEdit();
      break;
    case "TOGGLE_SIDEBAR":
      toggleSidebar();
      break;
    case "RUN_COMMANDS":
      logger.trace(`difficult RUN_COMMANDS ${JSON.stringify({ message })}`);
      runCommands(message.payload.commands);
      break;
    default:
      logger.log("Unrecognized message type:", message);
      break;
  }
}

function annotateSelectionAndEdit() {
  const annotationAnchors = annotateSelection();
  if (!annotationAnchors) {
    logger.warn("Unable to annotate selection");
    return;
  }
  postActionMessageToFrame(
    actions.extensionFrame.beginEditOfMediaExcerptFromAnchorInfo(
      annotationAnchors.anchorInfo
    )
  );
}

function postActionMessageToFrame(action: actions.ExtensionFrameAction) {
  getOption("howdjuBaseUrl", (baseUrl) => {
    logger.trace(
      `difficult postActionMessageToFrame ${JSON.stringify({ action })}`
    );
    doWhenFrameMessageHandlerReady((frameApi: FramePanelApi) => {
      frameApi.postMessage(
        {
          source: WindowMessageSource,
          action,
        },
        baseUrl
      );
    });
    showSidebar();
  });
}

function doWhenFrameMessageHandlerReady(callback: FramePanelApiCallback) {
  if (messageHandlerReady) {
    logger.trace("difficult doWhenFrameMessageHandlerReady.ready");
    const frameApi = getFrameApi();
    callback(frameApi);
  } else {
    logger.trace("difficult doWhenFrameMessageHandlerReady.notReady");
    messageHandlerReadyCallbacks.push(callback);
  }
}

function setMessageHandlerReady(isReady: boolean) {
  if (isReady) {
    logger.trace("difficult setMessageHandlerReady.ready");
    const frameApi = getFrameApi();
    for (const callback of messageHandlerReadyCallbacks) {
      try {
        callback(frameApi);
      } catch (err) {
        logger.error(
          "Error while invoking message-handler-ready callback",
          err
        );
      }
    }
    messageHandlerReadyCallbacks = [];
  }
  messageHandlerReady = isReady;
}
