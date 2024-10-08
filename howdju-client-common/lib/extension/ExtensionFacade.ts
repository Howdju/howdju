import { logger } from "howdju-common";

import { ExtensionMessage } from "./extensionMessages";

// Just reuse the chrome type since types are available for it.
type NativeExtension = Pick<
  typeof chrome,
  | "runtime"
  | "tabs"
  | "webNavigation"
  | "browserAction"
  | "storage"
  | "contextMenus"
  | "extension"
  | "webRequest"
>;

export class ExtensionFacade {
  extension: NativeExtension;

  constructor(extension: NativeExtension) {
    this.extension = extension;
  }

  sendRuntimeMessage(
    message: ExtensionMessage,
    responseCallback: (response: any) => void
  ) {
    this.extension.runtime.sendMessage(message, responseCallback);
  }

  async createTab(details: chrome.tabs.CreateProperties) {
    return this.extension.tabs.create(details);
  }

  queryTabs(
    queryInfo: chrome.tabs.QueryInfo,
    callback: (result: chrome.tabs.Tab[]) => void
  ) {
    this.extension.tabs.query(queryInfo, callback);
  }

  sendTabMessage(
    tabId: number,
    message: ExtensionMessage,
    responseCallback: (response: any) => void
  ) {
    this.extension.tabs.sendMessage(tabId, message, responseCallback);
  }

  addRuntimeOnMessageListener(
    listener: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void
  ) {
    this.extension.runtime.onMessage.addListener(listener);
  }

  addWebNavigationOnDOMContentLoadedListener(
    listener: (
      details: chrome.webNavigation.WebNavigationFramedCallbackDetails
    ) => void
  ) {
    this.extension.webNavigation.onDOMContentLoaded.addListener(listener);
  }

  addRuntimeOnInstalledListener(
    listener: (details: chrome.runtime.InstalledDetails) => void
  ) {
    this.extension.runtime.onInstalled.addListener(listener);
  }

  addBrowserActionOnClickedListener(listener: (tab: chrome.tabs.Tab) => void) {
    this.extension.browserAction.onClicked.addListener(listener);
  }

  createContextMenus(
    createProperties: chrome.contextMenus.CreateProperties,
    callback?: () => void
  ) {
    return this.extension.contextMenus.create(createProperties, callback);
  }

  executeScript(
    tabId: number,
    details: chrome.tabs.InjectDetails,
    callback?: (result: any[]) => void
  ) {
    this.extension.tabs.executeScript(tabId, details, callback);
  }

  async insertCSS(tabId: number, details: chrome.tabs.InjectDetails) {
    await this.extension.tabs.insertCSS(tabId, details);
  }

  hasLastError(): chrome.extension.LastError | undefined {
    // The type definition contradicts the docstring. The docstring says that it returns undefined if there is no last error.
    return this.extension.extension.lastError;
  }

  getLastErrorMessage() {
    return this.extension.extension.lastError.message;
  }

  addWebRequestOnHeadersReceivedListener(
    listener: (
      details: chrome.webRequest.WebResponseHeadersDetails
    ) => chrome.webRequest.BlockingResponse | void,
    filter: chrome.webRequest.RequestFilter,
    extraInfoSpec?: string[]
  ) {
    this.extension.webRequest.onHeadersReceived.addListener(
      listener,
      filter,
      extraInfoSpec
    );
  }

  setStorageLocal(
    items: {
      [key: string]: any;
    },
    callback: () => void
  ) {
    this.extension.storage.local.set(items, callback);
  }

  getStorageLocal(
    keys:
      | string
      | string[]
      | {
          [key: string]: any;
        }
      | null,
    callback: (items: { [key: string]: any }) => void
  ) {
    this.extension.storage.local.get(keys, callback);
  }

  getStorage(
    storageArea: "local" | "session",
    keys:
      | string
      | string[]
      | {
          [key: string]: any;
        }
      | null,
    callback: (items: { [key: string]: any }) => void
  ) {
    this.extension.storage[storageArea].get(keys, callback);
  }
}

class FakeExtension {
  runtime = makeCallableProxy<NativeExtension["runtime"]>();
  tabs = makeCallableProxy<NativeExtension["tabs"]>();
  webNavigation = makeCallableProxy<NativeExtension["webNavigation"]>();
  browserAction = makeCallableProxy<NativeExtension["browserAction"]>();
  storage = makeCallableProxy<NativeExtension["storage"]>();
  contextMenus = makeCallableProxy<NativeExtension["contextMenus"]>();
  extension = makeCallableProxy<NativeExtension["extension"]>();
  webRequest = makeCallableProxy<NativeExtension["webRequest"]>();
}

export const extensionFacade = makeExtensionFacade();
function makeExtensionFacade() {
  if ("chrome" in window) {
    // Chrome
    return new ExtensionFacade(window.chrome);
  } else if ("browser" in window) {
    // Firefox and Safari
    // TODO(399) use https://wiki.mozilla.org/WebExtensions and remove typecast
    return new ExtensionFacade((window as any).browser);
  } else {
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      logger.warn("Unsupported extension environment.");
    }
    return new ExtensionFacade(new FakeExtension());
  }
}

// A singleton function to pass to the proxy so that the proxy supports the `apply` trap.
// Other than the fact that it is a function, it's value has no effect on the behavior of
// makeCallableProxy.
// eslint-disable-next-line @typescript-eslint/no-empty-function -- value is irrelevant
function callableProxyTarget() {}

function makeCallableProxy<T>(): T {
  const names: (string | number | symbol)[] = [];
  return new Proxy(callableProxyTarget, {
    get(_target, name, receiver) {
      names.push(name);
      return receiver;
    },
    apply(_target, _thisArg, args) {
      console.log(`Extension proxy called ${names.join(".")}(${args})}`);
    },
  }) as T;
}
