// Babel runtime dependencies
import "core-js/stable";
import "regenerator-runtime/runtime";

import { logger } from "howdju-common";
import {
  extensionFacade as ext,
  ExtensionMessage,
  ContentScriptCommand,
  toggleSidebar,
  annotateSelection,
  runCommands,
} from "howdju-client-common";

import { attachHeadersListener } from "./attach";
import { getOptions } from "./options";
import { SetRequired } from "type-fest";

let tabReloadCommands:
  | {
      tabId: number;
      commands: ContentScriptCommand[];
    }
  | undefined = undefined;

ext.addBrowserActionOnClickedListener(onBrowserActionClicked);
ext.addRuntimeOnInstalledListener(onInstalled);
ext.addRuntimeOnMessageListener(onRuntimeMessage);
ext.addWebNavigationOnDOMContentLoadedListener(onDOMContentLoaded);

getOptions(
  ["howdjuBaseUrl", "isDevelopment"],
  ({ howdjuBaseUrl, isDevelopment }) => {
    attachHeadersListener({
      ext,
      hosts: howdjuBaseUrl,
      iframeHosts: howdjuBaseUrl,
      overrideFrameOptions: true,
      isDevelopment,
    });
  }
);

function onInstalled() {
  createContextMenus();
}

function createContextMenus() {
  const id =
    "howdju-context-menu-annotate" +
    (process.env.NODE_ENV === "development" ? "-dev" : "");
  const title =
    "+ Howdju" + (process.env.NODE_ENV === "development" ? " (dev)" : "");
  ext.createContextMenus(
    {
      id,
      title,
      contexts: ["selection"],
      onclick: sendAnnotateSelectionMessage,
    },
    logLastError
  );
}

function onRuntimeMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse?: (response?: any) => void
): void {
  const { type } = message;
  if (type === "RUN_COMMANDS_WHEN_TAB_RELOADED" && ensureTabId(sender.tab)) {
    tabReloadCommands = {
      tabId: sender.tab.id,
      commands: message.payload.commands,
    };
  }

  if (sendResponse) sendResponse();
}

function onDOMContentLoaded(
  details: chrome.webNavigation.WebNavigationFramedCallbackDetails
) {
  const { tabId } = details;
  if (tabReloadCommands && tabId === tabReloadCommands.tabId) {
    sendRunCommandsMessage(tabId, tabReloadCommands.commands, () => {
      tabReloadCommands = undefined;
    });
  }
}

type TabWithId = SetRequired<chrome.tabs.Tab, "id">;

function ensureTabId(tab?: chrome.tabs.Tab): tab is TabWithId {
  if (!tab?.id) {
    throw new Error("Tab must have an ID");
  }
  return true;
}

function onBrowserActionClicked(tab: chrome.tabs.Tab) {
  if (ensureTabId(tab)) {
    sendToggleSidebarMessage(tab.id);
  }
}

function sendToggleSidebarMessage(tabId: number) {
  sendMessage(tabId, toggleSidebar());
}

function sendRunCommandsMessage(
  tabId: number,
  commands: ContentScriptCommand[],
  responseCallback: (response: any) => void
) {
  sendMessage(tabId, runCommands(commands), responseCallback);
}

// responseCallback is required but sometimes we don't want to do anything.
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noopResponseCallback = () => {};

function sendMessage(
  tabId: number,
  message: ExtensionMessage,
  responseCallback: (response: any) => void = noopResponseCallback
) {
  // TODO(401) can we avoid loading the script and css on every message?
  ext.executeScript(
    tabId,
    {
      file: "content.js",
    },
    () => {
      ext.sendTabMessage(tabId, message, responseCallback);
    }
  );
  void ext.insertCSS(tabId, {
    file: "content.css",
  });
}

function sendAnnotateSelectionMessage(
  _info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab
) {
  if (ensureTabId(tab)) {
    sendMessage(tab.id, annotateSelection());
  }
}

function logLastError() {
  if (ext.hasLastError()) {
    logger.error("Last error: " + ext.getLastErrorMessage());
  }
}
